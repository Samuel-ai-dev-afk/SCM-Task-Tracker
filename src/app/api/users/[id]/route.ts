import { prisma } from "@/lib/prisma";
import { requireManager, HttpError } from "@/lib/authz";
import { route } from "@/lib/http";

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
