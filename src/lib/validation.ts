import { z } from "zod";
import { STATUSES, PILLARS } from "@/lib/constants";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date (YYYY-MM-DD).");

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .or(z.literal(""))
  .nullable()
  .optional();

// Time logged against a task, in whole minutes. Capped at 999h so a typo in
// the hours box can't quietly poison a month's total.
const minutesSpent = z
  .number()
  .int("Use whole minutes.")
  .min(0, "Time can't be negative.")
  .max(59940, "That's more than 999 hours — check the hours and minutes.")
  .nullable()
  .optional();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Give the task a title.").max(200),
  description: z.string().max(4000).optional().default(""),
  // Optional: staff adding their own work are always the assignee, so the
  // route fills this in. Managers must choose (checked in the route).
  assignedToId: z.string().min(1, "Choose who this is for.").optional(),
  assignedFromId: z.string().min(1).optional(),
  strategicPillar: z.enum(PILLARS).nullable().optional(),
  status: z.enum(STATUSES).optional().default("Not Started"),
  dateAssigned: dateStr,
  deadline: dateStr.nullable().optional(),
  dateCompleted: dateStr.nullable().optional(),
  minutesSpent,
  fileLink: optionalUrl,
});

// Fields a manager may patch.
export const managerPatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(4000).optional(),
  assignedToId: z.string().min(1).optional(),
  assignedFromId: z.string().min(1).optional(),
  strategicPillar: z.enum(PILLARS).nullable().optional(),
  status: z.enum(STATUSES).optional(),
  dateAssigned: dateStr.optional(),
  deadline: dateStr.nullable().optional(),
  dateCompleted: dateStr.nullable().optional(),
  minutesSpent,
  fileLink: optionalUrl,
});

// Fields a staff member may patch — status, completion date, file link only.
// (Deadline is intentionally absent: staff can never set it, enforced here and
// in the route handler.)
export const staffPatchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  dateCompleted: dateStr.nullable().optional(),
  // Staff log their own time — that's the whole point of the hours report.
  minutesSpent,
  fileLink: optionalUrl,
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Write something first.").max(2000),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  role: z.enum(["manager", "staff"]),
  password: z.string().min(4, "Password must be at least 4 characters.").max(200),
});

// Only AUS addresses may self-register — exactly "@aus.edu", no subdomains.
export const AUS_EMAIL_DOMAIN = "aus.edu";

export function isAusEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${AUS_EMAIL_DOMAIN}`);
}

/**
 * Public self-signup. Deliberately has no `role` field: this endpoint only ever
 * creates staff accounts, so a crafted request can't mint a manager.
 */
export const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email.")
    .refine(isAusEmail, "Sign up with your @aus.edu email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

// A manager's decision on a pending signup.
export const approvalSchema = z.object({
  action: z.enum(["approve", "decline"]),
});

// Editing your own profile. Email and role are deliberately absent: those stay
// with managers.
export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(120),
});

// Date range for the hours report.
export const hoursQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date."),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date."),
  userId: z.string().min(1).optional(),
});

// Changing your own password. The account comes from the session, never the
// body, so there's no user id here.
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.string().min(8, "New password must be at least 8 characters.").max(200),
});
