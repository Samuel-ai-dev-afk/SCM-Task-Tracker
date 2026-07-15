import { route } from '@/lib/route';
import { requireManager } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { serializeTask } from '@/lib/serialize';

// GET /api/analytics/pillars - Task distribution by strategic pillar
export async function GET() {
  return route(async () => {
    const user = await requireManager();

    // Get count of tasks by strategic pillar
    const pillarCounts = await prisma.task.groupBy({
      by: ['strategicPillar'],
      _count: true,
      where: {
        // Managers can see all tasks
        ...(user.role !== 'manager' ? { assignedToId: user.id } : {})
      }
    });

    // Format for chart consumption
    return pillarCounts.map((item: any) => ({
      pillar: item.strategicPillar || null, // Keep null for unassigned
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
  {
  return new Response('Method Not Allowed', { status: 405 });
}