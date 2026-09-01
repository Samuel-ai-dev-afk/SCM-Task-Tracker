import { prisma } from "@/lib/prisma";
import { requireManager, HttpError } from "@/lib/authz";
import { route } from "@/lib/http";
import { calendarEntryPatchSchema } from "@/lib/validation";
import { serializeCalendarEntry } from "@/lib/serialize";

type Params = { params: { id: string } };

// PATCH /api/calendar/entries/:id — managers only. Edit an entry in place.
export async function PATCH(req: Request, { params }: Params) {
  return route(async () => {
    await requireManager();
    const input = calendarEntryPatchSchema.parse(await req.json());

    const existing = await prisma.calendarEntry.findUnique({ where: { id: params.id } });
    if (!existing) throw new HttpError(404, "That calendar entry no longer exists.");

    const entry = await prisma.calendarEntry.update({
      where: { id: params.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.kind !== undefined ? { kind: input.kind } : {}),
        ...(input.date !== undefined ? { date: new Date(input.date + "T00:00:00Z") } : {}),
        ...(input.time !== undefined ? { time: input.time ? input.time : null } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return serializeCalendarEntry(entry);
  });
}

// DELETE /api/calendar/entries/:id — managers only. Entries own no other data,
// so this is a real delete rather than a soft one.
export async function DELETE(_req: Request, { params }: Params) {
  return route(async () => {
    await requireManager();
    const existing = await prisma.calendarEntry.findUnique({ where: { id: params.id } });
    if (!existing) throw new HttpError(404, "That calendar entry no longer exists.");

    await prisma.calendarEntry.delete({ where: { id: params.id } });
    return { ok: true };
  });
}
