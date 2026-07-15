import { route } from '@/lib/route';
import { requireManager } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { serializeTask } from '@/lib/serialize';

// GET /api/analytics/status - Task status distribution
export async function GET() {
  return route(async () => {
    const user = await requireManager();

    // Get count of tasks by status
    const statusCounts = await prisma.task.groupBy({
      by: ['status'],
      _count: true,
      where: {
        // Managers can see all tasks
        ...(user.role !== 'manager' ? { assignedToId: user.id } : {})
      }
    });

    // Format for chart consumption
    return statusCounts.map((item: any) => ({
      status: item.status,
      count: Number(item._count) || 0
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