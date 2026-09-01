import { prisma } from "@/lib/prisma";
import { requireUser, HttpError } from "@/lib/authz";
import { route } from "@/lib/http";
import { changePasswordSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";

// Passwords this app hands out itself: the seeded demo password and the default
// a manager gets pre-filled when adding someone. Anyone still on one of these
// gets nudged to pick their own.
const DEFAULT_PASSWORDS = [process.env.SEED_PASSWORD || "demo1234", "changeme123"];

// GET /api/me/password — is the signed-in user still on a default password?
export async function GET() {
  return route(async () => {
    const me = await requireUser();
    const user = await prisma.user.findUnique({ where: { id: me.id } });
    if (!user) throw new HttpError(404, "Account not found.");

    for (const candidate of DEFAULT_PASSWORDS) {
      if (candidate && (await bcrypt.compare(candidate, user.passwordHash))) {
        return { usingDefaultPassword: true };
      }
    }
    return { usingDefaultPassword: false };
  });
}

/**
 * PATCH /api/me/password — change your own password.
 *
 * The account is always taken from the session, never from the request, so this
 * can only ever change the password of whoever is signed in. Knowing the
 * current password is required, so a borrowed session can't lock the owner out.
 */
export async function PATCH(req: Request) {
  return route(async () => {
    const me = await requireUser();
    const input = changePasswordSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { id: me.id } });
    if (!user) throw new HttpError(404, "Account not found.");

    const currentIsRight = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!currentIsRight) throw new HttpError(400, "Your current password isn't right.");

    const unchanged = await bcrypt.compare(input.newPassword, user.passwordHash);
    if (unchanged) throw new HttpError(400, "That's already your password — pick a new one.");

    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    await prisma.user.update({ where: { id: me.id }, data: { passwordHash } });

    return { ok: true };
  });
}
