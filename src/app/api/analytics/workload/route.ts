import { route } from '@/lib/route';
import { requireManager } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { serializeTask } from '@/lib/serialize';

// GET /api/analytics/workload - User workload (open tasks per user)
export async function GET() {
  return route(async () => {
    const user = await requireManager();

    // Get open task count per user
    const workloadData = await prisma.user.findMany({
      where: {
        active: true,
        ...(user.role !== 'manager' ? { id: user.id } : {})
      },
      select: {
        id: true,
        name: true,
        role: true,
        _count: {
          select: {
            tasks: {
              where: {
                status: {
                  not: 'Completed' // Consider everything except completed as "open"
                }
              }
            }
          }
        }
      }
    });

    return workloadData.map((user: any) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      openCount: user._count.tasks || 0
    }));
  });
}

// POST handler (not needed for GET-only endpoints, but required by Next.js route conventions)
export async function POST() {
  return new Response('Method Not Allowed', { status: 405 });
}

// PUT handler (not needed for GET-only endpoints, but required by Next.js route conventions)
export async function PUT() {
  return new Response('Method Not Allowed', { status: 405 });
}

// DELETE handler (not needed for GET-only endpoints, but required by Next.js route conventions)
export async function DELETE() {
  return new Response('Method Not Allowed', { status: 405 });
}