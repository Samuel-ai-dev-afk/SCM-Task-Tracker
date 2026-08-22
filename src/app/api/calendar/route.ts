import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { route } from "@/lib/http";
import { hoursQuerySchema } from "@/lib/validation";
import { toDateInput } from "@/lib/dates";
import type { Channel, Status } from "@/lib/constants";

/**
 * GET /api/calendar?from=&to= — what is going live in a date range.
 *
 * Deliberately visible to everyone, staff included: the point of the calendar
 * is that the whole department can see the publishing schedule and understand
 * what their deadline is feeding. It returns a narrow projection rather than
 * whole tasks — no description, file links or comments — so opening the
 * calendar never exposes more than the schedule itself. Full task detail still
 * goes through /api/tasks/:id, which keeps its row-level guard.
 */
export async function GET(req: Request) {
  return route(async () => {
    await requireUser();
    const url = new URL(req.url);
    const { from, to } = hoursQuerySchema.parse({
      from: url.searchParams.get("from") ?? "",
      to: url.searchParams.get("to") ?? "",
    });

    const tasks = await prisma.task.findMany({
      where: {
        publishDate: {
          gte: new Date(from + "T00:00:00Z"),
          lte: new Date(to + "T23:59:59.999Z"),
        },
      },
      include: { assignedTo: { select: { id: true, name: true } } },
      orderBy: { publishDate: "asc" },
    });

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status as Status,
      channel: (t.channel as Channel | null) ?? null,
      publishDate: t.publishDate ? toDateInput(t.publishDate) : null,
      deadline: t.deadline ? toDateInput(t.deadline) : null,
      dateCompleted: t.dateCompleted ? toDateInput(t.dateCompleted) : null,
      assignedToId: t.assignedToId,
      assignedToName: t.assignedTo.name,
    }));
  });
}
