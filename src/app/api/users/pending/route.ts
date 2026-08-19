import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/authz";
import { route } from "@/lib/http";
import { serializeUser } from "@/lib/serialize";

// GET /api/users/pending — managers only. Self-signups awaiting a decision,
// oldest request first. (Static segment, so it wins over /api/users/[id].)
export async function GET() {
  return route(async () => {
    await requireManager();
    const users = await prisma.user.findMany({
      where: { approved: false, active: false },
      orderBy: { createdAt: "asc" },
    });
    return users.map((u) => serializeUser(u));
  });
}
