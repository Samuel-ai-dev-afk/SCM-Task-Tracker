import type { Task, User, Comment, CalendarEntry } from "@prisma/client";
import type { TaskDTO, UserDTO, CommentDTO, CalendarEntryDTO } from "@/types";
import type { Status, Pillar, Role, Channel, EntryKind } from "@/lib/constants";
import { toDateInput } from "@/lib/dates";

type TaskWithRelations = Task & {
  assignedFrom: Pick<User, "id" | "name">;
  assignedTo: Pick<User, "id" | "name">;
  comments?: (Comment & { author: Pick<User, "id" | "name"> })[];
  _count?: { comments: number };
};

export function serializeTask(t: TaskWithRelations): TaskDTO {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    strategicPillar: (t.strategicPillar as Pillar | null) ?? null,
    status: t.status as Status,
    fileLink: t.fileLink ?? null,
    dateAssigned: toDateInput(t.dateAssigned),
    deadline: t.deadline ? toDateInput(t.deadline) : null,
    dateCompleted: t.dateCompleted ? toDateInput(t.dateCompleted) : null,
    minutesSpent: t.minutesSpent ?? null,
    publishDate: t.publishDate ? toDateInput(t.publishDate) : null,
    channel: (t.channel as Channel | null) ?? null,
    assignedFromId: t.assignedFromId,
    assignedFromName: t.assignedFrom.name,
    assignedToId: t.assignedToId,
    assignedToName: t.assignedTo.name,
    commentCount: t._count?.comments ?? t.comments?.length ?? 0,
    comments: t.comments?.map(serializeComment),
  };
}

export function serializeComment(c: Comment & { author: Pick<User, "id" | "name"> }): CommentDTO {
  return {
    id: c.id,
    body: c.body,
    authorId: c.authorId,
    authorName: c.author.name,
    createdAt: c.createdAt.toISOString(),
  };
}

export function serializeUser(u: User, openCount?: number): UserDTO {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Role,
    active: u.active,
    approved: u.approved,
    createdAt: u.createdAt.toISOString(),
    openCount,
  };
}

export function serializeCalendarEntry(
  e: CalendarEntry & { createdBy: Pick<User, "id" | "name"> }
): CalendarEntryDTO {
  return {
    id: e.id,
    title: e.title,
    kind: e.kind as EntryKind,
    date: toDateInput(e.date),
    time: e.time ?? null,
    notes: e.notes,
    createdById: e.createdById,
    createdByName: e.createdBy.name,
  };
}
