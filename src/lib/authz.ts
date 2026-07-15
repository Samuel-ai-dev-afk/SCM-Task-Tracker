// Server-side authorization helpers. Every API route funnels through these.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/constants";

export type SessionUser = { id: string; name: string; email: string; role: Role };

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Resolve the current user or throw 401. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new HttpError(401, "You must be signed in.");
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
  };
}

/** Resolve the current user and require the manager role, else throw 403. */
export async function requireManager(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "manager") throw new HttpError(403, "Managers only.");
  return user;
}

export function isManager(user: SessionUser): boolean {
  return user.role === "manager";
}

/**
 * Row-level read guard for a single task. Managers may read any task;
 * staff may only read tasks assigned to them.
 */
export function assertCanReadTask(user: SessionUser, task: { assignedToId: string }): void {
  if (user.role === "manager") return;
  if (task.assignedToId !== user.id) throw new HttpError(404, "Task not found.");
}

/**
 * Write guard. Managers may edit anything. Staff may edit only their own
 * tasks and only a restricted set of fields (enforced by the caller).
 */
export function assertCanWriteTask(user: SessionUser, task: { assignedToId: string }): void {
  if (user.role === "manager") return;
  if (task.assignedToId !== user.id) throw new HttpError(404, "Task not found.");
}
