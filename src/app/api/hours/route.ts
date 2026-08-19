import { prisma } from "@/lib/prisma";
import { requireUser, isManager } from "@/lib/authz";
import { route } from "@/lib/http";
import { hoursQuerySchema } from "@/lib/validation";
import { toDateInput } from "@/lib/dates";

/**
 * GET /api/hours?from=&to=&userId= — time logged in a date range.
 *
 * Time is counted in the period the task was *completed*, which is the only
 * date that marks when the work landed. Tasks with no logged time are ignored
 * so they don't dilute the averages.
 *
 * Staff always see only themselves: the userId parameter is ignored for them.
 */
export async function GET(req: Request) {
  return route(async () => {
    const user = await requireUser();
    const url = new URL(req.url);
    const { from, to, userId } = hoursQuerySchema.parse({
      from: url.searchParams.get("from") ?? "",
      to: url.searchParams.get("to") ?? "",
      userId: url.searchParams.get("userId") ?? undefined,
    });

    // Whole days, inclusive of both ends.
    const start = new Date(from + "T00:00:00Z");
    const end = new Date(to + "T23:59:59.999Z");

    const scopedTo = isManager(user) ? (userId && userId !== "all" ? userId : null) : user.id;

    const tasks = await prisma.task.findMany({
      where: {
        minutesSpent: { not: null },
        dateCompleted: { gte: start, lte: end },
        ...(scopedTo ? { assignedToId: scopedTo } : {}),
      },
      include: { assignedTo: { select: { id: true, name: true } } },
      orderBy: { dateCompleted: "desc" },
    });

    const byPerson = new Map<string, { id: string; name: string; minutes: number; taskCount: number }>();
    let totalMinutes = 0;

    for (const t of tasks) {
      const mins = t.minutesSpent ?? 0;
      totalMinutes += mins;
      const row = byPerson.get(t.assignedToId) ?? {
        id: t.assignedToId,
        name: t.assignedTo.name,
        minutes: 0,
        taskCount: 0,
      };
      row.minutes += mins;
      row.taskCount += 1;
      byPerson.set(t.assignedToId, row);
    }

    return {
      from,
      to,
      totalMinutes,
      taskCount: tasks.length,
      averageMinutes: tasks.length ? Math.round(totalMinutes / tasks.length) : 0,
      people: [...byPerson.values()].sort((a, b) => b.minutes - a.minutes),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        userId: t.assignedToId,
        userName: t.assignedTo.name,
        dateCompleted: t.dateCompleted ? toDateInput(t.dateCompleted) : null,
        minutesSpent: t.minutesSpent ?? 0,
      })),
    };
  });
}
