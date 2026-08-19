import { prisma } from "@/lib/prisma";
import {
  requireUser,
  HttpError,
  assertCanReadTask,
  assertCanWriteTask,
  isManager,
} from "@/lib/authz";
import { route } from "@/lib/http";
import { serializeTask } from "@/lib/serialize";
import { managerPatchSchema, staffPatchSchema } from "@/lib/validation";
import type { Prisma } from "@prisma/client";

const taskInclude = {
  assignedFrom: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
  comments: {
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  },
  _count: { select: { comments: true } },
} as const;

type Params = { params: { id: string } };

// GET /api/tasks/:id — row-level read guard.
export async function GET(_req: Request, { params }: Params) {
  return route(async () => {
    const user = await requireUser();
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: taskInclude,
    });
    if (!task) throw new HttpError(404, "Task not found.");
    assertCanReadTask(user, task); // staff get 404 on someone else's task
    return serializeTask(task);
  });
}

// PATCH /api/tasks/:id — managers edit anything; staff edit status/completion/link only.
export async function PATCH(req: Request, { params }: Params) {
  return route(async () => {
    const user = await requireUser();
    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) throw new HttpError(404, "Task not found.");
    assertCanWriteTask(user, task);

    const raw = await req.json();
    const data: Prisma.TaskUpdateInput = {};

    if (isManager(user)) {
      const input = managerPatchSchema.parse(raw);
      if (input.title !== undefined) data.title = input.title;
      if (input.description !== undefined) data.description = input.description;
      if (input.strategicPillar !== undefined) data.strategicPillar = input.strategicPillar;
      if (input.status !== undefined) data.status = input.status;
      if (input.dateAssigned !== undefined)
        data.dateAssigned = new Date(input.dateAssigned + "T00:00:00Z");
      if (input.deadline !== undefined)
        data.deadline = input.deadline ? new Date(input.deadline + "T00:00:00Z") : null;
      if (input.dateCompleted !== undefined)
        data.dateCompleted = input.dateCompleted
          ? new Date(input.dateCompleted + "T00:00:00Z")
          : null;
      if (input.minutesSpent !== undefined) data.minutesSpent = input.minutesSpent;
      if (input.fileLink !== undefined) data.fileLink = input.fileLink ? input.fileLink : null;
      if (input.assignedToId !== undefined) {
        const assignee = await prisma.user.findFirst({
          where: { id: input.assignedToId, active: true },
        });
        if (!assignee) throw new HttpError(400, "That person isn't on the tracker.");
        data.assignedTo = { connect: { id: input.assignedToId } };
      }
      if (input.assignedFromId !== undefined)
        data.assignedFrom = { connect: { id: input.assignedFromId } };
    } else {
      // Staff: only these fields, and only on their own task.
      const input = staffPatchSchema.parse(raw);
      if (input.status !== undefined) data.status = input.status;
      if (input.dateCompleted !== undefined)
        data.dateCompleted = input.dateCompleted
          ? new Date(input.dateCompleted + "T00:00:00Z")
          : null;
      if (input.minutesSpent !== undefined) data.minutesSpent = input.minutesSpent;
      if (input.fileLink !== undefined) data.fileLink = input.fileLink ? input.fileLink : null;
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data,
      include: taskInclude,
    });
    return serializeTask(updated);
  });
}

// DELETE /api/tasks/:id — managers only.
export async function DELETE(_req: Request, { params }: Params) {
  return route(async () => {
    const user = await requireUser();
    if (!isManager(user)) throw new HttpError(403, "Managers only.");
    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) throw new HttpError(404, "Task not found.");
    await prisma.task.delete({ where: { id: params.id } });
    return { ok: true };
  });
}
