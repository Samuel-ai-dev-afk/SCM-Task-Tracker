import { prisma } from "@/lib/prisma";
import { requireUser, isManager } from "@/lib/authz";
import { route } from "@/lib/http";
import { hoursQuerySchema } from "@/lib/validation";
import { serializeCalendarEntry } from "@/lib/serialize";
import { toDateInput } from "@/lib/dates";
import type { Channel, Status } from "@/lib/constants";

/**
 * GET /api/calendar?from=&to= — everything on the schedule in a date range.
 *
 * Two different things share the calendar:
 *   - tasks, placed by their publish date, which carry a deadline and a buffer
 *   - entries, which a manager put there directly: meetings, events, planned
 *     posts, reminders. These have no assignee, deadline or status.
 *
 * Visible to everyone, staff included: the point of the calendar is that the
 * whole department can see what's happening. Tasks return a narrow projection —
 * no description, file links or comments — so opening the calendar never
 * exposes more than the schedule itself. Full task detail still goes through
 * /api/tasks/:id, which keeps its row-level guard.
 *
 * One thing is withheld: the buffer. How long before publication someone
 * finished is a performance figure, and that belongs between them and their
 * manager. Staff see it on their own tasks and nobody else's. The deadline and
 * completion dates it is derived from are stripped here rather than hidden in
 * the UI — otherwise the numbers would still be sitting in the API response.
 */
export async function GET(req: Request) {
  return route(async () => {
    const user = await requireUser();
    const url = new URL(req.url);
    const { from, to } = hoursQuerySchema.parse({
      from: url.searchParams.get("from") ?? "",
      to: url.searchParams.get("to") ?? "",
    });

    const start = new Date(from + "T00:00:00Z");
    const end = new Date(to + "T23:59:59.999Z");

    const [tasks, entries] = await Promise.all([
      prisma.task.findMany({
        where: { publishDate: { gte: start, lte: end } },
        include: { assignedTo: { select: { id: true, name: true } } },
        orderBy: { publishDate: "asc" },
      }),
      prisma.calendarEntry.findMany({
        where: { date: { gte: start, lte: end } },
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: [{ date: "asc" }, { time: "asc" }],
      }),
    ]);

    return {
      tasks: tasks.map((t) => {
        // Managers see every buffer; staff see only their own.
        const showBuffer = isManager(user) || t.assignedToId === user.id;
        return {
          id: t.id,
          title: t.title,
          status: t.status as Status,
          channel: (t.channel as Channel | null) ?? null,
          publishDate: t.publishDate ? toDateInput(t.publishDate) : null,
          deadline: showBuffer && t.deadline ? toDateInput(t.deadline) : null,
          dateCompleted: showBuffer && t.dateCompleted ? toDateInput(t.dateCompleted) : null,
          showBuffer,
          assignedToId: t.assignedToId,
          assignedToName: t.assignedTo.name,
        };
      }),
      entries: entries.map(serializeCalendarEntry),
    };
  });
}
