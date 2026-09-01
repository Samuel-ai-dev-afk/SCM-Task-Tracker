import { prisma } from "@/lib/prisma";
import { requireManager, HttpError } from "@/lib/authz";
import { route } from "@/lib/http";
import { serializeUser } from "@/lib/serialize";
import { approvalSchema } from "@/lib/validation";

type Params = { params: { id: string } };

// DELETE /api/users/:id — soft delete. Managers only. Managers can never be removed.
export async function DELETE(_req: Request, { params }: Params) {
  return route(async () => {
    await requireManager();
    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target || !target.active) throw new HttpError(404, "Person not found.");

    // Hard rule, enforced server-side: managers cannot be removed by anyone.
    if (target.role === "manager") {
      throw new HttpError(403, "Managers can't be removed from the tracker.");
    }

    // Soft delete — deactivate. Their tasks stay on the board for reassignment.
    await prisma.user.update({ where: { id: params.id }, data: { active: false } });
    return { ok: true };
  });
}

/**
 * PATCH /api/users/:id — managers only. Approve or decline a pending signup.
 *
 * Approving only ever activates a staff account: signups are created with role
 * "staff" and the role is never read from the request body, so this can't be
 * used to promote anyone to manager.
 */
export async function PATCH(req: Request, { params }: Params) {
  return route(async () => {
    await requireManager();
    const { action } = approvalSchema.parse(await req.json());

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) throw new HttpError(404, "Person not found.");
    if (target.approved) throw new HttpError(409, "That request has already been handled.");

    if (action === "decline") {
      // A pending account has never signed in and owns no tasks or comments,
      // so the record can be removed outright.
      await prisma.user.delete({ where: { id: params.id } });
      return { ok: true, declined: true };
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { active: true, approved: true, role: "staff" },
    });
    return serializeUser(user, 0);
  });
}
