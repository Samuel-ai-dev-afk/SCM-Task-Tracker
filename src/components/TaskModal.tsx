"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/client";
import { joinMinutes, splitMinutes, formatMinutes } from "@/lib/time";
import { STATUSES, PILLARS, type Role, type Status } from "@/lib/constants";
import { weekNumber, weekRange, deadlineVariance, varianceLabel, commentDate } from "@/lib/dates";
import { Avatar } from "@/components/ui";
import type { TaskDTO, UserDTO, CommentDTO } from "@/types";

type Me = { id: string; name: string; role: Role };

type Form = {
  title: string;
  assignedFromId: string;
  assignedToId: string;
  description: string;
  strategicPillar: string;
  dateAssigned: string;
  deadline: string;
  dateCompleted: string;
  status: Status;
  fileLink: string;
  // Time logged, kept as two strings while being typed.
  hours: string;
  minutes: string;
};

const today = () => new Date().toISOString().slice(0, 10);

export function TaskModal({
  me,
  isNew,
  task,
  staff,
  managers,
  onClose,
  onSaved,
  onChanged,
}: {
  me: Me;
  isNew: boolean;
  task: TaskDTO | null;
  staff: UserDTO[];
  managers: UserDTO[];
  onClose: () => void;
  onSaved: () => void;
  onChanged: () => void;
}) {
  const isManager = me.role === "manager";

  const [form, setForm] = useState<Form>(() => ({
    title: task?.title ?? "",
    assignedFromId: task?.assignedFromId ?? me.id,
    assignedToId: task?.assignedToId ?? staff[0]?.id ?? "",
    description: task?.description ?? "",
    strategicPillar: task?.strategicPillar ?? "",
    dateAssigned: task?.dateAssigned ?? today(),
    deadline: task?.deadline ?? "",
    dateCompleted: task?.dateCompleted ?? "",
    status: task?.status ?? "Not Started",
    fileLink: task?.fileLink ?? "",
    hours: splitMinutes(task?.minutesSpent).h,
    minutes: splitMinutes(task?.minutesSpent).m,
  }));
  const [comments, setComments] = useState<CommentDTO[]>(task?.comments ?? []);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Pull full detail (comments + read-only fields) for an existing task.
  const loadDetail = useCallback(async () => {
    if (isNew || !task) return;
    try {
      const full: TaskDTO = await api.get(`/api/tasks/${task.id}`);
      setComments(full.comments ?? []);
      setForm((f) => ({
        ...f,
        title: full.title,
        assignedFromId: full.assignedFromId,
        assignedToId: full.assignedToId,
        description: full.description,
        strategicPillar: full.strategicPillar ?? "",
        dateAssigned: full.dateAssigned,
        deadline: full.deadline ?? "",
        dateCompleted: full.dateCompleted ?? "",
        hours: splitMinutes(full.minutesSpent).h,
        minutes: splitMinutes(full.minutesSpent).m,
        status: full.status,
        fileLink: full.fileLink ?? "",
      }));
    } catch {
      /* keep list data */
    }
  }, [isNew, task]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // How early/late the task was finished vs the deadline (same for both roles).
  const variance = deadlineVariance(form.deadline, form.dateCompleted);

  const fromName = managers.find((u) => u.id === form.assignedFromId)?.name ?? task?.assignedFromName ?? "";
  const toName = staff.find((u) => u.id === form.assignedToId)?.name ?? task?.assignedToName ?? "";

  async function save() {
    setError("");
    setBusy(true);
    try {
      if (isNew) {
        if (!form.title.trim()) throw new Error("Give the task a title.");
        await api.post("/api/tasks", {
          title: form.title.trim(),
          description: form.description.trim(),
          assignedToId: form.assignedToId,
          assignedFromId: form.assignedFromId,
          strategicPillar: form.strategicPillar || null,
          status: form.status,
          dateAssigned: form.dateAssigned,
          deadline: form.deadline || null,
          dateCompleted: form.dateCompleted || null,
          minutesSpent: joinMinutes(form.hours, form.minutes),
          fileLink: form.fileLink.trim() || "",
        });
      } else if (task) {
        const payload = isManager
          ? {
              title: form.title.trim(),
              description: form.description.trim(),
              assignedToId: form.assignedToId,
              assignedFromId: form.assignedFromId,
              strategicPillar: form.strategicPillar || null,
              status: form.status,
              dateAssigned: form.dateAssigned,
              deadline: form.deadline || null,
              dateCompleted: form.dateCompleted || null,
              minutesSpent: joinMinutes(form.hours, form.minutes),
              fileLink: form.fileLink.trim() || "",
            }
          : {
              status: form.status,
              dateCompleted: form.dateCompleted || null,
              minutesSpent: joinMinutes(form.hours, form.minutes),
              fileLink: form.fileLink.trim() || "",
            };
        await api.patch(`/api/tasks/${task.id}`, payload);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
      setBusy(false);
    }
  }

  async function remove() {
    if (!task) return;
    if (!confirm("Delete this task? This can't be undone.")) return;
    setBusy(true);
    try {
      await api.del(`/api/tasks/${task.id}`);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
      setBusy(false);
    }
  }

  async function postComment() {
    const body = newComment.trim();
    if (!body || !task) return;
    try {
      await api.post(`/api/tasks/${task.id}/comments`, { body });
      setNewComment("");
      await loadDetail();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post comment.");
    }
  }

  const w = weekNumber(form.dateAssigned);

  return (
    <>
      <div className="fixed inset-0 bg-overlay z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(500px,94vw)] max-h-[88vh] z-[51] bg-card rounded-xl shadow-modal flex flex-col overflow-hidden animate-pop">
        {/* Header */}
        <div className="px-[18px] py-[15px] border-b border-line flex items-start gap-2.5">
          <div className="flex-1 min-w-0">
            <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-faint block mb-1">
              {isNew ? "New assignment" : `Week ${w} · ${weekRange(w)}`}
            </span>
            <h3 className="font-serif font-bold text-[16px] leading-tight text-ink">
              {isNew ? "Assign a task" : form.title || task?.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-faint hover:text-ink hover:bg-line2 rounded px-1.5 py-0.5 text-[19px] leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-[18px] py-4 overflow-y-auto scroll-quiet flex-1">
          {isManager && (
            <Field label="Task">
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="What needs doing?"
                className="w-full text-[13px] bg-field border border-line rounded-md px-2.5 py-2"
              />
            </Field>
          )}

          <div className="flex gap-2.5">
            <Field label="From" className="flex-1 min-w-0">
              {isManager ? (
                <select
                  value={form.assignedFromId}
                  onChange={(e) => set("assignedFromId", e.target.value)}
                  className="w-full text-[13px] bg-field border border-line rounded-md px-2.5 py-2"
                >
                  {managers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <ReadOnly>{fromName}</ReadOnly>
              )}
            </Field>
            <Field label="To" className="flex-1 min-w-0">
              {isManager ? (
                <select
                  value={form.assignedToId}
                  onChange={(e) => set("assignedToId", e.target.value)}
                  className="w-full text-[13px] bg-field border border-line rounded-md px-2.5 py-2"
                >
                  {staff.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <ReadOnly>{toName}</ReadOnly>
              )}
            </Field>
          </div>

          <Field label="Description">
            {isManager ? (
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the work…"
                className="w-full min-h-[64px] text-[13px] bg-field border border-line rounded-md px-2.5 py-2 leading-relaxed resize-y"
              />
            ) : (
              <ReadOnly>{form.description || <span className="text-faint">No description.</span>}</ReadOnly>
            )}
          </Field>

          <Field label="Strategic pillar">
            {isManager ? (
              <select
                value={form.strategicPillar}
                onChange={(e) => set("strategicPillar", e.target.value)}
                className="w-full text-[13px] bg-field border border-line rounded-md px-2.5 py-2"
              >
                <option value="">— none —</option>
                {PILLARS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            ) : (
              <ReadOnly>{form.strategicPillar || <span className="text-faint">—</span>}</ReadOnly>
            )}
          </Field>

          <div className="flex gap-2.5">
            <Field label="Assigned" className="flex-1 min-w-0">
              {isManager ? (
                <input
                  type="date"
                  value={form.dateAssigned}
                  onChange={(e) => set("dateAssigned", e.target.value)}
                  className="w-full text-[13px] bg-field border border-line rounded-md px-2.5 py-2"
                />
              ) : (
                <ReadOnly mono>{form.dateAssigned || "—"}</ReadOnly>
              )}
            </Field>
            <Field label="Deadline" className="flex-1 min-w-0">
              {isManager ? (
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => set("deadline", e.target.value)}
                  className="w-full text-[13px] bg-field border border-line rounded-md px-2.5 py-2"
                />
              ) : (
                <ReadOnly mono>{form.deadline || <span className="text-faint">Not set</span>}</ReadOnly>
              )}
            </Field>
          </div>

          {/* Time logged — the figure the Hours report totals up. */}
          <div className="mb-3 bg-subtle border border-line2 rounded-lg px-3.5 py-3">
            <span className="block font-mono text-[9.5px] tracking-[0.1em] uppercase text-faint mb-2">
              Time spent on this task
            </span>
            <div className="flex items-end gap-2.5">
              <div className="w-[88px]">
                <input
                  type="number" min={0} inputMode="numeric" placeholder="0"
                  value={form.hours}
                  onChange={(e) => set("hours", e.target.value)}
                  className="w-full text-center font-mono text-[15px] font-semibold bg-field border border-line rounded-md px-2 py-2"
                />
                <div className="text-[10.5px] text-faint text-center mt-1">Hours</div>
              </div>
              <div className="text-[17px] text-faint pb-6">:</div>
              <div className="w-[88px]">
                <input
                  type="number" min={0} max={59} inputMode="numeric" placeholder="0"
                  value={form.minutes}
                  onChange={(e) => set("minutes", e.target.value)}
                  className="w-full text-center font-mono text-[15px] font-semibold bg-field border border-line rounded-md px-2 py-2"
                />
                <div className="text-[10.5px] text-faint text-center mt-1">Minutes</div>
              </div>
              <div className="flex-1 pb-6 text-[11.5px] text-muted leading-relaxed">
                {form.hours || form.minutes ? (
                  <>
                    Logged as{" "}
                    <span className="font-mono font-semibold text-ink">
                      {formatMinutes(safeMinutes(form.hours, form.minutes))}
                    </span>
                    . Counts toward the period this task is completed in.
                  </>
                ) : (
                  <>Leave blank if you haven&apos;t tracked it. You can add it later.</>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2.5">
            <Field label={isManager ? "Completed" : "Date completed"} className="flex-1 min-w-0">
              <input
                type="date"
                value={form.dateCompleted}
                onChange={(e) => set("dateCompleted", e.target.value)}
                className="w-full text-[13px] bg-field border border-line rounded-md px-2.5 py-2"
              />
            </Field>
            <Field label="Status" className="flex-1 min-w-0">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as Status)}
                className="w-full text-[13px] bg-field border border-line rounded-md px-2.5 py-2"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Vs deadline">
            <div
              className={
                "font-mono text-[12px] px-2.5 py-2.5 rounded-md text-center " +
                (variance !== null
                  ? variance > 0
                    ? "bg-burgundy-600 text-white"
                    : variance < 0
                      ? "bg-green-600 text-white"
                      : "bg-green-700 text-white"
                  : "bg-subtle text-faint border border-line2")
              }
            >
              {variance !== null
                ? varianceLabel(variance)
                : form.deadline
                  ? "Add the completed date to see the result"
                  : "Manager sets a deadline; staff sets the completed date"}
            </div>
          </Field>

          <Field label="File link">
            <input
              value={form.fileLink}
              onChange={(e) => set("fileLink", e.target.value)}
              placeholder="Paste a Drive, Canva, or Dropbox link"
              className="w-full text-[13px] bg-field border border-line rounded-md px-2.5 py-2"
            />
          </Field>
          {form.fileLink && (
            <a
              href={form.fileLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-burgundy-600 font-semibold border border-line rounded-md px-2.5 py-1.5 hover:bg-line2 mb-1"
            >
              ↗ Open the file
            </a>
          )}

          {/* Comments */}
          {!isNew && task && (
            <div className="border-t border-line mt-4 pt-3.5">
              <h4 className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-faint mb-3">
                Comments · {comments.length}
              </h4>
              {comments.length === 0 ? (
                <div className="text-[12px] text-faint pb-2">No comments yet.</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5 mb-3">
                    <Avatar name={c.authorName} size={26} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-ink">
                        {c.authorName}
                        <time className="font-mono text-[10px] text-faint font-normal ml-1.5">
                          {commentDate(c.createdAt)}
                        </time>
                      </div>
                      <p className="text-[12.5px] text-ink2 leading-relaxed mt-0.5 break-words">
                        {c.body}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Leave a note for the team…"
                className="w-full min-h-[56px] text-[13px] bg-field border border-line rounded-md px-2.5 py-2 resize-y"
              />
              <button
                onClick={postComment}
                className="mt-1.5 font-semibold text-[12px] border border-line rounded-md px-2.5 py-1.5 hover:bg-line2"
              >
                Post comment
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 px-2.5 py-2 rounded-md bg-danger-bg text-danger-fg text-[12px]">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-[18px] py-3 border-t border-line bg-sunken flex gap-2">
          <button
            onClick={save}
            disabled={busy}
            className="font-semibold text-[13px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-md px-3.5 py-2 transition disabled:opacity-60"
          >
            {isNew ? "Assign task" : "Save changes"}
          </button>
          {!isNew && isManager && (
            <button
              onClick={remove}
              disabled={busy}
              className="font-semibold text-[13px] text-danger-fg border border-danger-line rounded-md px-3.5 py-2 hover:bg-danger-bg transition"
            >
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="font-semibold text-[13px] border border-line rounded-md px-3.5 py-2 hover:bg-line2"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"mb-3 " + className}>
      <label className="block font-mono text-[9.5px] tracking-[0.1em] uppercase text-faint mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function ReadOnly({ children, mono = false }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <div
      className={
        "px-2.5 py-2 bg-subtle border border-line2 rounded-md text-[13px] min-h-[35px] leading-normal " +
        (mono ? "font-mono" : "")
      }
    >
      {children}
    </div>
  );
}

/** Preview-only: never throws while the user is mid-keystroke. */
function safeMinutes(h: string, m: string): number {
  try {
    return joinMinutes(h, m) ?? 0;
  } catch {
    return 0;
  }
}
