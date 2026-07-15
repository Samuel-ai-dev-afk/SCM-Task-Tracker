import { route } from '@/lib/http';
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
        role: true
      }
    });

    // Get open task counts (tasks assigned to user that are not completed)
    const openTaskCounts = await prisma.task.groupBy({
      by: ['assignedToId'],
      _count: true,
      where: {
        status: {
          not: 'Completed'
        }
        // We'll filter out null assignedToId in the mapping below
      }
    });

    // Map the open task counts to users
    const openTaskCountMap: Record<string, number> = {};
    openTaskCounts.forEach((item: any) => {
      if (item.assignedToId) {
        openTaskCountMap[item.assignedToId] = Number(item._count) || 0;
      }
    });

    return workloadData.map((user: any) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      openCount: openTaskCountMap[user.id] || 0
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