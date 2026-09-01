import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/authz";
import { route } from "@/lib/http";
import { calendarEntrySchema } from "@/lib/validation";
import { serializeCalendarEntry } from "@/lib/serialize";

// POST /api/calendar/entries — managers only. Adds a meeting, event, planned
// post or reminder straight to the shared calendar. Staff read the calendar
// but don't schedule on it.
export async function POST(req: Request) {
  return route(async () => {
    const me = await requireManager();
    const input = calendarEntrySchema.parse(await req.json());

    const entry = await prisma.calendarEntry.create({
      data: {
        title: input.title,
        kind: input.kind,
        date: new Date(input.date + "T00:00:00Z"),
        time: input.time ? input.time : null,
        notes: input.notes ?? "",
        createdById: me.id,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return serializeCalendarEntry(entry);
  });
}
