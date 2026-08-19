import { prisma } from "@/lib/prisma";
import { requireUser, isManager, HttpError } from "@/lib/authz";
import { route } from "@/lib/http";
import { serializeTask } from "@/lib/serialize";
import { createTaskSchema } from "@/lib/validation";

const taskInclude = {
  assignedFrom: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
  _count: { select: { comments: true } },
} as const;

// GET /api/tasks — managers see all; staff see only their own (enforced in the query).
export async function GET() {
  return route(async () => {
    const user = await requireUser();
    const where = user.role === "manager" ? {} : { assignedToId: user.id };
    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: { dateAssigned: "asc" },
    });
    return tasks.map(serializeTask);
  });
}

/**
 * POST /api/tasks — managers assign work to anyone; staff may add work they've
 * done themselves.
 *
 * A staff member's task is always assigned to and from themselves, whatever the
 * request body says — so this can't be used to put work on someone else's board.
 */
export async function POST(req: Request) {
  return route(async () => {
    const user = await requireUser();
    const input = createTaskSchema.parse(await req.json());

    const assignedToId = isManager(user) ? input.assignedToId : user.id;

    const assignee = await prisma.user.findFirst({
      where: { id: assignedToId, active: true },
    });
    if (!assignee) throw new HttpError(400, "That person isn't on the tracker.");

    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description ?? "",
        strategicPillar: input.strategicPillar ?? null,
        status: input.status ?? "Not Started",
        fileLink: input.fileLink ? input.fileLink : null,
        dateAssigned: new Date(input.dateAssigned + "T00:00:00Z"),
        deadline: input.deadline ? new Date(input.deadline + "T00:00:00Z") : null,
        dateCompleted: input.dateCompleted ? new Date(input.dateCompleted + "T00:00:00Z") : null,
        minutesSpent: input.minutesSpent ?? null,
        assignedToId,
        // Managers may credit another manager as the assigner; staff logging
        // their own work are always both sides of it.
        assignedFromId: isManager(user) ? input.assignedFromId ?? user.id : user.id,
      },
      include: taskInclude,
    });
    return serializeTask(task);
  });
}
