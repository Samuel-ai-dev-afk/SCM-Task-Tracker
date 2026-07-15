'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { useSearchParams } from 'next/navigation';
import { TaskStatusSummary, UserWorkload, TaskTimelineData, PillarData } from '@/types/analytics';

export default async function AnalyticsPage() {
  const [statusData, setStatusData] = useState<TaskStatusSummary[]>([]);
  const [workloadData, setWorkloadData] = useState<UserWorkload[]>([]);
  const [timelineData, setTimelineData] = useState<TaskTimelineData[]>([]);
  const [pillarData, setPillarData] = useState<PillarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      // Fetch task status distribution
      const [statusResponse, workloadResponse, timelineResponse, pillarResponse] = await Promise.all([
        api.get('/api/analytics/status'),
        api.get('/api/analytics/workload'),
        api.get('/api/analytics/timeline'),
        api.get('/api/analytics/pillars')
      ]);

      setStatusData(statusResponse);
      setWorkloadData(workloadResponse);
      setTimelineData(timelineResponse);
      setPillarData(pillarResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-burgundy-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-ink">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="flex items-center justify-center py-12">
          <div className="text-center text-[A5372E]">
            <p className="font-semibold mb-2">Error loading analytics</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="px-6 pt-5">
        <h1 className="font-serif font-bold text-[21px] tracking-[-0.012em] text-ink">Analytics</h1>
        <p className="text-[12.5px] text-muted mt-0.5">
          Insights into team performance and task distribution
        </p>
      </div>

      {/* Alert if no data */}
      {!statusData || statusData.length === 0 ? (
        <div className="px-6 py-6 text-center text-[A5372E]">
          <p>No task data available for analytics.</p>
        </div>
      ) : (
        <>
          {/* Status Distribution Chart */}
          <div className="px-6 pt-6">
            <h2 className="font-serif font-bold text-[18px] text-ink mb-4">Task Status Distribution</h2>
            <StatusChart data={statusData} />
          </div>

          {/* Workload Chart */}
          <div className="px-6 pt-6">
            <h2 className="font-serif font-bold text-[18px] text-ink mb-4">Team Workload</h2>
            <WorkloadChart data={workloadData} />
          </div>

          {/* Completion Trend Chart */}
          <div className="px-6 pt-6">
            <h2 className="font-serif font-bold text-[18px] text-ink mb-4">Completion Trends</h2>
            <TimelineChart data={timelineData} />
          </div>

          {/* Pillar Distribution Chart */}
          <div className="px-6 pt-6">
            <h2 className="font-serif font-bold text-[18px] text-ink mb-4">Tasks by Strategic Pillar</h2>
            <PillarChart data={pillarData} />
          </div>
        </>
      )}

      {/* Footer spacing */}
      <div className="pb-12"></div>
    </div>
  );
}

// Chart Components
function StatusChart({ data }: { data: TaskStatusSummary[] }) {
  if (!data || data.length === 0) return <div className="text-center py-8 text-faint">No status data available</div>;

  const total = data.reduce((sum: number, item: TaskStatusSummary) => sum + item.count, 0);
  const barHeight = 20;
  const barGap = 8;
  const chartHeight = data.length * (barHeight + barGap) + 20;
  const maxCount = Math.max(...data.map((d: TaskStatusSummary) => d.count)) || 1;

  return (
    <div className="bg-card border border-line rounded-[10px] overflow-hidden shadow-card">
      <svg width="100%" height={chartHeight + 40} viewBox={`0 0 400 ${chartHeight + 40}`} className="w-full">
        {/* Bars */}
        {data.map((item: TaskStatusSummary, index: number) => {
          const percentage = (item.count / maxCount) * 100;
          const barWidth = (percentage / 100) * 350; // Max width 350px
          const y = 20 + index * (barHeight + barGap);

          // Get color based on status
          let color = '#8A94A6'; // Default gray
          switch (item.status) {
            case 'Completed': color = '#2C6B42'; break;
            case 'In Progress': color = '#8B1E2D'; break;
            case 'In Review': color = '#D4AF37'; break;
            case 'Blocked': color = '#A5372E'; break;
            case 'Not Started': color = '#8A94A6'; break;
          }

          return (
            <g key={item.status}>
              {/* Bar background */}
              <rect x={25} y={y} width="350" height={barHeight} fill="#F7F8FA" rx="4" />
              {/* Bar fill */}
              <rect x={25} y={y} width={barWidth} height={barHeight} fill={color} rx="4" />
              {/* Label */}
              <text x={20} y={y + barHeight / 2 + 4} textAnchor="end" dominantBaseline="middle" fontSize="12" fill="#6B7280" fontFamily="IBM Plex Mono, monospace">
                {item.status}
              </text>
              {/* Count */}
              <text x={390} y={y + barHeight / 2 + 4} textAnchor="end" dominantBaseline="middle" fontSize="12" fill="#6B7280" fontFamily="IBM Plex Mono, monospace">
                {item.count}
              </text>
              {/* Percentage */}
              <text x={400} y={y + barHeight / 2 + 4} textAnchor="start" dominantBaseline="middle" fontSize="12" fill="#6B7280" fontFamily="IBM Plex Mono, monospace">
                {`(${(item.count / total * 100).toFixed(1)}%)`}
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text x="200" y={chartHeight + 30} textAnchor="middle" fontSize="12" fill="#6B7280" fontFamily="IBM Plex Mono, monospace">
          Number of Tasks
        </text>
      </svg>
    </div>
  );
}

function WorkloadChart({ data }: { data: UserWorkload[] }) {
  if (!data || data.length === 0) return <div className="text-center py-8 text-faint">No workload data available</div>;

  const maxCount = Math.max(...data.map((d: UserWorkload) => d.openCount)) || 1;
  const barHeight = 20;
  const barGap = 12;
  const chartHeight = data.length * (barHeight + barGap) + 20;

  return (
    <div className="bg-card border border-line rounded-[10px] overflow-hidden shadow-card">
      <svg width="100%" height={chartHeight + 60} viewBox={`0 0 500 ${chartHeight + 60}`} className="w-full">
        {/* Bars */}
        {data.map((item: UserWorkload, index: number) => {
          const percentage = (item.openCount / maxCount) * 100;
          const barWidth = (percentage / 100) * 400; // Max width 400px
          const y = 20 + index * (barHeight + barGap);

          // Determine bar color based on workload
          let color = '#8A94A6'; // Default gray
          if (item.openCount === maxCount && maxCount > 0) {
            color = '#8B1E2D'; // Red for highest workload
          } else if (item.openCount > maxCount * 0.7) {
            color = '#D4AF37'; // Yellow for high workload
          }

          return (
            <g key={item.id}>
              {/* Bar background */}
              <rect x={80} y={y} width="400" height={barHeight} fill="#F7F8FA" rx="4" />
              {/* Bar fill */}
              <rect x={80} y={y} width={barWidth} height={barHeight} fill={color} rx="4" />
              {/* User name */}
              <text x={70} y={y + barHeight / 2 + 4} textAnchor="end" dominantBaseline="middle" fontSize="12" fill="#6B7280" fontFamily="IBM Plex Mono, monospace">
                {item.name}
              </text>
              {/* Count */}
              <text x={490} y={y + barHeight / 2 + 4} textAnchor="end" dominantBaseline="middle" fontSize="12" fill="#6B7280" fontFamily="IBM Plex Mono, monospace">
                {item.openCount} open
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text x="250" y={chartHeight + 50} textAnchor="middle" fontSize="12" fill="#6B7280" fontFamily="IBM Plex Mono, monospace">
          Number of Open Tasks
        </text>

        {/* Legend */}
        <g transform="translate(20, 30)">
          <rect x={0} y={0} width={12} height={12} fill="#8B1E2D" />
          <text x={20} y={10} fontSize="11" fill="#6B7280" fontFamily="IBM Plex Mono, monospace" dy="3">
            Highest workload
          </text>
          <rect x={0} y={20} width={12} height={12} fill="#D4AF37" />
          <text x={20} y={30} fontSize="11" fill="#6B7280" fontFamily="IBM Plex Mono, monospace" dy="3">
            High workload
          </text>
          <rect x={0} y={40} width={12} height={12} fill="#8A94A6" />
          <text x={20} y={50} fontSize="11" fill="#6B7280" fontFamily="IBM Plex Mono, monospace" dy="3">
            Low/No workload
          </text>
        </g>
      </svg>
    </div>
  );
}

function TimelineChart({ data }: { data: TaskTimelineData[] }) {
  if (!data || data.length === 0) return <div className="text-center py-8 text-faint">No timeline data available</div>;

  // Extract status types from the data (excluding weekStart)
  const statusTypes = Object.keys(data[0] || {}).filter(key => key !== 'weekStart') as (keyof TaskTimelineData)[];
  const weekCount = data.length;
  const barWidth = 20;
  const groupGap = 10;
  const chartWidth = 60 + weekCount * (statusTypes.length * (barWidth + 2) + groupGap);
  const maxCount = Math.max(...data.map(day =>
    Object.values(day).reduce((sum: number, val: number | undefined) => sum + (val || 0), 0)
  )) || 1;
  const chartHeight = 180;

  return (
    <div className="bg-card border border-line rounded-[10px] overflow-hidden shadow-card">
      <div className="px-4 pt-4">
        <svg width="100%" height={chartHeight + 80} viewBox={`0 0 ${chartWidth} ${chartHeight + 80}`} className="w-full">
          {/* Bars - stacked bar chart */}
          {data.map((day: TaskTimelineData, weekIndex: number) => {
            const xOffset = 50 + weekIndex * (statusTypes.length * (barWidth + 2) + groupGap);
            let yOffset = chartHeight - 20; // Start from bottom

            return statusTypes.map((status: keyof TaskTimelineData, statusIndex: number) => {
              const value = day[status] || 0;
              const height = (value / maxCount) * (chartHeight - 40); // Scale to fit chart area
              const y = yOffset - height; // Position from bottom
              const x = xOffset + statusIndex * (barWidth + 2);

              // Get color based on status
              let color = '#8A94A6'; // Default gray
              switch (String(status)) {
                case 'Completed': color = '#2C6B42'; break;
                case 'In Progress': color = '#8B1E2D'; break;
                case 'In Review': color = '#D4AF37'; break;
                case 'Blocked': color = '#A5372E'; break;
                case 'Not Started': color = '#8A94A6'; break;
              }

              return (
                <g key={`${weekIndex}-${status}`}>
                  {/* Bar segment */}
                  <rect x={x} y={y} width={barWidth} height={height} fill={color} rx="2" />
                  {/* Value label (only show if significant) */}
                  {value > 0 && (
                    <text x={x + barWidth / 2} y={y + height / 2 + 4} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="white" fontFamily="IBM Plex Mono, monospace">
                      {value}
                    </text>
                  )}
                </g>
              );
            });
          })}

          {/* X-axis labels (weeks) */}
          {data.map((day: TaskTimelineData, index: number) => {
            const x = 50 + index * (statusTypes.length * (barWidth + 2) + groupGap) + (statusTypes.length * (barWidth + 2)) / 2;
            return (
              <text key={index} x={x} y={chartHeight + 10} textAnchor="middle" fontSize="10" fill="#6B7280" fontFamily="IBM Plex Mono, monospace">
                {day.weekStart}
              </text>
            );
          })}

          {/* Y-axis label */}
          <text x="20" y="{chartHeight / 2}" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#6B7280" fontFamily="IBM Plex Mono, monospace" transform="rotate(-90, 20, ${chartHeight / 2})">
            Number of Tasks
          </text>

          {/* Legend */}
          <g transform={`translate(20, ${chartHeight + 20})`}>
            {statusTypes.map((status: keyof TaskTimelineData, index: number) => {
              let color = '#8A94A6'; // Default gray
              switch (String(status)) {
                case 'Completed': color = '#2C6B42'; break;
                case 'In Progress': color = '#8B1E2D'; break;
                case 'In Review': color = '#D4AF37'; break;
                case 'Blocked': color = '#A5372E'; break;
                case 'Not Started': color = '#8A94A6'; break;
              }

              return (
                <g key={index} transform={`translate(0, ${index * 20})`}>
                  <rect x={0} y={0} width={12} height={12} fill={color} rx="2" />
                  <text x={20} y={10} fontSize="11" fill="#6B7280" fontFamily="IBM Plex Mono, monospace" dy="3">
                    {String(status)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

function PillarChart({ data }: { data: PillarData[] }) {
  if (!data || data.length === 0) return <div className="text-center py-8 text-faint">No pillar data available</div>;

  // Filter out null pillars for display, but keep track of them
  const filteredData = data.filter(item => item.pillar !== null);
  const nullCount = data.find(item => item.pillar === null)?.count || 0;

  if (filteredData.length === 0 && nullCount === 0) {
    return <div className="text-center py-8 text-faint">No pillar data available</div>;
  }

  const maxCount = Math.max(...filteredData.map((d: PillarData) => d.count), nullCount) || 1;
  const barHeight = 20;
  const barGap = 12;
  const chartHeight = (filteredData.length + (nullCount > 0 ? 1 : 0)) * (barHeight + barGap) + 20;

  return (
    <div className="bg-card border border-line rounded-[10px] overflow-hidden shadow-card">
      <svg width="100%" height={chartHeight + 60} viewBox={`0 0 500 ${chartHeight + 60}`} className="w-full">
        {/* Bars */}
        {[...filteredData, ...(nullCount > 0 ? [{ pillar: null, count: nullCount }] : [])].map((item: PillarData, index: number) => {
          const percentage = (item.count / maxCount) * 100;
          const barWidth = (percentage / 100) * 400; // Max width 400px
          const y = 20 + index * (barHeight + barGap);

          // Use a consistent color for pillars (blue-ish)
          const color = '#3B82F6'; // Blue for pillars

          return (
            <g key={item.pillar ?? 'null'}>
              {/* Bar background */}
              <rect x={80} y={y} width="400" height={barHeight} fill="#F7F8FA" rx="4" />
              {/* Bar fill */}
              <rect x={80} y={y} width={barWidth} height={barHeight} fill={color} rx="4" />
              {/* Label */}
              <text x={70} y={y + barHeight / 2 + 4} textAnchor="end" dominantBaseline="middle" fontSize="12" fill="#6B7280" fontFamily="IBM Plex Mono, monospace">
                {item.pillar ?? '(No Pillar)'}
              </text>
              {/* Count */}
              <text x={490} y={y + barHeight / 2 + 4} textAnchor="end" dominantBaseline="middle" fontSize="12" fill="#6B7280" fontFamily="IBM Plex Mono, monospace">
                {item.count}
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text x="250" y={chartHeight + 50} textAnchor="middle" fontSize="12" fill="#6B7280" fontFamily="IBM Plex Mono, monospace">
          Number of Tasks
        </text>
      </svg>
    </div>
  );
}