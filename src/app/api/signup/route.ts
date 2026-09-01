import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/authz";
import { route } from "@/lib/http";
import { signupSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";

/**
 * POST /api/signup — public. Staff self-registration.
 *
 * Three rules are enforced here and nowhere else can be relied on:
 *   1. The role is hard-coded to "staff". The request body has no role field,
 *      so nobody can sign themselves up as a manager.
 *   2. The email must be an @aus.edu address (checked in signupSchema).
 *   3. The account is created inactive and unapproved — a manager has to
 *      approve it on the Team page before the person can sign in.
 */
export async function POST(req: Request) {
  return route(async () => {
    const input = signupSchema.parse(await req.json());
    const passwordHash = await bcrypt.hash(input.password, 10);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });

    if (existing) {
      // Someone who already has a usable account should sign in, not sign up.
      if (existing.active) {
        throw new HttpError(409, "That email already has an account — sign in instead.");
      }
      // A manager account should never be resurrected through the public form.
      if (existing.role !== "staff") {
        throw new HttpError(409, "That email can't be registered here. Ask a manager for help.");
      }
      if (!existing.approved) {
        throw new HttpError(409, "You've already signed up — a manager still has to approve it.");
      }
      // Previously removed staff member asking to come back: turn their record
      // into a fresh pending request rather than silently reinstating them.
      await prisma.user.update({
        where: { email: input.email },
        data: { name: input.name, role: "staff", passwordHash, active: false, approved: false },
      });
    } else {
      await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          role: "staff", // never taken from the request
          passwordHash,
          active: false,
          approved: false,
        },
      });
    }

    // No user object is returned — a pending account has nothing to show yet.
    return { ok: true, pending: true };
  });
}
