import type { Role, Status, Pillar, Channel } from "@/lib/constants";

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  approved: boolean; // false = self-signup waiting for a manager's decision
  createdAt: string; // ISO
  openCount?: number; // populated on the team view
};

export type CommentDTO = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string; // ISO
};

export type TaskDTO = {
  id: string;
  title: string;
  description: string;
  strategicPillar: Pillar | null;
  status: Status;
  fileLink: string | null;
  dateAssigned: string; // YYYY-MM-DD
  deadline: string | null; // YYYY-MM-DD (when manager expects completion)
  dateCompleted: string | null; // YYYY-MM-DD (when actually completed)
  minutesSpent: number | null; // time logged by the assignee, in minutes
  publishDate: string | null; // YYYY-MM-DD (when it goes live)
  channel: Channel | null;
  assignedFromId: string;
  assignedFromName: string;
  assignedToId: string;
  assignedToName: string;
  commentCount: number;
  comments?: CommentDTO[]; // only on the detail endpoint
};
