import { prisma } from "@/lib/prisma";
import { requireUser, requireManager, HttpError } from "@/lib/authz";
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

// POST /api/tasks — managers only.
export async function POST(req: Request) {
  return route(async () => {
    const user = await requireManager();
    const input = createTaskSchema.parse(await req.json());

    const assignee = await prisma.user.findFirst({
      where: { id: input.assignedToId, active: true },
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
        assignedToId: input.assignedToId,
        // Assigner is always the acting manager unless explicitly overridden.
        assignedFromId: input.assignedFromId ?? user.id,
      },
      include: taskInclude,
    });
    return serializeTask(task);
  });
}
