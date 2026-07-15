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

// GET /api/analytics/timeline - Task completion trends over time (weekly)
export async function GET() {
  return route(async () => {
    const user = await requireManager();

    // Get tasks grouped by week of assignment and status
    // This is a simplified approach - in practice you might want to use raw SQL for better date grouping
    const tasks = await prisma.task.findMany({
      where: {
        ...(user.role !== 'manager' ? { assignedToId: user.id } : {})
      },
      select: {
        status: true,
        dateAssigned: true
      }
    });

    // Group by week (starting from June 1, 2026 as per the app's week system)
    const WEEK1_START = Date.UTC(2026, 5, 1); // June 1, 2026
    const DAY_MS = 86_400_000;

    const weeklyCounts: Record<string, Record<string, number>> = {};

    tasks.forEach((task: any) => {
      if (!task.dateAssigned) return;

      const taskTime = task.dateAssigned.getTime();
      const weekDiff = Math.floor((taskTime - WEEK1_START) / DAY_MS / 7);
      const weekStart = new Date(WEEK1_START + weekDiff * 7 * DAY_MS);
      const weekLabel = `${weekStart.getUTCFullYear()}-W${String(weekDiff + 1).padStart(2, '0')}`;

      if (!weeklyCounts[weekLabel]) {
        weeklyCounts[weekLabel] = {};
      }

      weeklyCounts[weekLabel][task.status] = (weeklyCounts[weekLabel][task.status] || 0) + 1;
    });

    // Convert to array format for the chart
    const result = Object.keys(weeklyCounts).map(week => ({
      weekStart: week,
      ...weeklyCounts[week]
    })).sort((a, b) =>
      // Sort by week (chronological)
      new Date(a.weekStart.split('-')[0], parseInt(a.weekStart.split('W')[1]) - 1, 1)
        .getTime() -
      new Date(b.weekStart.split('-')[0], parseInt(b.weekStart.split('W')[1]) - 1, 1)
        .getTime()
    ));

    return result;
  });
}

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