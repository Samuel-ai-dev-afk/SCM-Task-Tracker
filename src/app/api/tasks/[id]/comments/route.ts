import { prisma } from "@/lib/prisma";
import { requireUser, HttpError, assertCanReadTask } from "@/lib/authz";
import { route } from "@/lib/http";
import { serializeComment } from "@/lib/serialize";
import { commentSchema } from "@/lib/validation";

type Params = { params: { id: string } };

// POST /api/tasks/:id/comments — anyone on the task (assignee or a manager) may post.
export async function POST(req: Request, { params }: Params) {
  return route(async () => {
    const user = await requireUser();
    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) throw new HttpError(404, "Task not found.");
    assertCanReadTask(user, task); // staff can only comment on their own task

    const { body } = commentSchema.parse(await req.json());
    const comment = await prisma.comment.create({
      data: { taskId: task.id, authorId: user.id, body },
      include: { author: { select: { id: true, name: true } } },
    });
    return serializeComment(comment);
  });
}
