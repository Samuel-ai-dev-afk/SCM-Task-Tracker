import { prisma } from "@/lib/prisma";
import { requireUser, HttpError } from "@/lib/authz";
import { route } from "@/lib/http";
import { serializeUser } from "@/lib/serialize";
import { updateProfileSchema } from "@/lib/validation";

// GET /api/me — the signed-in user's own profile.
export async function GET() {
  return route(async () => {
    const me = await requireUser();
    const user = await prisma.user.findUnique({ where: { id: me.id } });
    if (!user) throw new HttpError(404, "Account not found.");
    return serializeUser(user);
  });
}

// PATCH /api/me — change your own display name. Email and role are not
// editable here; those stay with managers.
export async function PATCH(req: Request) {
  return route(async () => {
    const me = await requireUser();
    const input = updateProfileSchema.parse(await req.json());
    const user = await prisma.user.update({
      where: { id: me.id },
      data: { name: input.name },
    });
    return serializeUser(user);
  });
}
