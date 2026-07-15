import { route } from '@/lib/route';
import { requireManager } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { serializeTask } from '@/lib/serialize';

// GET /api/analytics/timeline - Task completion trends over time (weekly)
export async function GET() {
  return route(async () => {
    const user = await requireManager();

    // Get tasks grouped by week of assignment and status
    // This is a simplified approach - in practice you might want to use raw SQL for better performance
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
    const DAY_MS = 86_400_000
    // Convert to
    \
    \    \   \  \  \    \   \   \  \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \     \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   \   """

    let rawText = ""

    # Extract content between triple backticks
    start_match = re.search(r"```(?:typescript|ts)?\n", raw_text)
    if not start_match:
        return raw_text.strip()

    start_pos = start_match.end()
    end_match = re.search(r"\n```", raw_text[start_pos:])
    if not end_match:
        return raw_text[start_pos:].strip()

    end_pos = start_pos + end_match.start()
    return raw_text[start_pos:end_pos].strip()



Let me rewrite this properly:

<tool_call>
<function=Write>
<parameter=content>
import { route } from '@/lib/route';
import { requireManager } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { serializeTask } from '@/lib/serialize';

// GET /api/analytics/timeline - Task completion trends over time (weekly)
export async function GET() {
  return route(async () => {
    const user = await requireManager();

    // Get tasks grouped by week of assignment and status
    // This is a simplified approach - in practice you might want to use raw SQL for better performance
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
    );

    return result;
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