export type TaskStatusSummary = {
  status: string;
  count: number;
};

export type UserWorkload = {
  id: string;
  name: string;
  role: 'manager' | 'staff';
  openCount: number;
};

export type TaskTimelineData = {
  weekStart: string;
  'Not Started'?: number;
  'In Progress'?: number;
  'In Review'?: number;
  Blocked?: number;
  Completed?: number;
};

export type PillarData = {
  pillar: string | null;
  count: number;
};