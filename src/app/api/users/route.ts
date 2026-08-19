import { prisma } from "@/lib/prisma";
import { requireManager, HttpError } from "@/lib/authz";
import { route } from "@/lib/http";
import { serializeUser } from "@/lib/serialize";
import { createUserSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";

// GET /api/users — managers only. Returns active, approved users with
// open-task counts. Pending signups live at /api/users/pending instead, so they
// never show up as assignable people.
export async function GET() {
  return route(async () => {
    await requireManager();
    const users = await prisma.user.findMany({
      where: { active: true, approved: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    const openCounts = await prisma.task.groupBy({
      by: ["assignedToId"],
      where: { status: { not: "Completed" } },
      _count: { _all: true },
    });
    const countByUser = new Map(openCounts.map((c) => [c.assignedToId, c._count._all]));

    return users.map((u) => serializeUser(u, countByUser.get(u.id) ?? 0));
  });
}

// POST /api/users — managers only. Adds a person (staff or manager).
export async function POST(req: Request) {
  return route(async () => {
    await requireManager();
    const input = createUserSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing?.active) throw new HttpError(409, `${input.email} is already on the tracker.`);

    const passwordHash = await bcrypt.hash(input.password, 10);

    // Reactivate a previously removed (or still-pending) account if the email
    // matches. A manager adding someone by hand is itself the approval.
    const user = existing
      ? await prisma.user.update({
          where: { email: input.email },
          data: {
            name: input.name,
            role: input.role,
            active: true,
            approved: true,
            passwordHash,
          },
        })
      : await prisma.user.create({
          data: {
            name: input.name,
            email: input.email,
            role: input.role,
            passwordHash,
            active: true,
            approved: true,
          },
        });

    return serializeUser(user, 0);
  });
}
