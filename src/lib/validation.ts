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

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Give the task a title.").max(200),
  description: z.string().max(4000).optional().default(""),
  assignedToId: z.string().min(1, "Choose who this is for."),
  assignedFromId: z.string().min(1).optional(),
  strategicPillar: z.enum(PILLARS).nullable().optional(),
  status: z.enum(STATUSES).optional().default("Not Started"),
  dateAssigned: dateStr,
  deadline: dateStr.nullable().optional(),
  dateCompleted: dateStr.nullable().optional(),
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
  fileLink: optionalUrl,
});

// Fields a staff member may patch — status, completion date, file link only.
// (Deadline is intentionally absent: staff can never set it, enforced here and
// in the route handler.)
export const staffPatchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  dateCompleted: dateStr.nullable().optional(),
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
