import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PASSWORD = process.env.SEED_PASSWORD || "demo1234";

// The six real department members (emails as provided).
const USERS = [
  { name: "Larissa Smitha Dsilva", email: "ldsilva@aus.edu", role: "manager" as const },
  { name: "Adeel Murtaza", email: "smmurtaza@aus.edu", role: "manager" as const },
  { name: "Samar Mahmoud", email: "smahmoud@aus.edu", role: "manager" as const },
  { name: "Syed Bukhari", email: "sbukhari@aus.edu", role: "manager" as const },
  { name: "Samuel Kebete", email: "b00101717@aus.edu", role: "staff" as const },
  { name: "Abdalla AlAli", email: "amali@aus.edu", role: "staff" as const },
];

const LARISSA = "ldsilva@aus.edu";
const SAM = "b00101717@aus.edu";

// Task titles/descriptions from "Visibility Tracker (1).xlsx". Completion dates
// come from the original tracker (scm_tracker_2.html), matched by title, since
// the Excel's completion column was blank.
//
// A few Week 4/5 rows carried a leftover "2026-06-15" assign date in the Excel;
// where the real completion date makes that impossible, the assign date follows
// the original tracker instead (Fast/Slow-Paced Video: 15→18 Jun).
type SeedTask = {
  title: string;
  description?: string;
  status: string;
  assigned: string; // YYYY-MM-DD
  completed?: string; // YYYY-MM-DD (actual completion, from the original tracker)
  note?: string; // -> seeded as a comment from Sam
};

const TASKS: SeedTask[] = [
  // ---- Week 1 · June 1–7 ----
  { title: "Welcome and Introduction", status: "Completed", assigned: "2026-06-01", completed: "2026-06-01" },
  {
    title: "Talkwalker Onboarding",
    description: "Explore the main dashboard to see how the system tracks metrics.",
    status: "Completed",
    assigned: "2026-06-01",
    completed: "2026-06-01",
  },
  {
    title: "Leopard Video",
    description: "Final editing of the Leopard Video",
    status: "Completed",
    assigned: "2026-06-02",
    completed: "2026-06-02",
  },
  {
    title: "Talkwalker: Competitor",
    description:
      'Check the "Share of Voice" chart and note our engagement numbers vs our top 3 competitors.',
    status: "Completed",
    assigned: "2026-06-02",
    completed: "2026-06-02",
  },
  {
    title: "Graduation Story Idea",
    description: "Brainstorm a cool story segment idea for the day of graduation.",
    status: "Completed",
    assigned: "2026-06-02",
    completed: "2026-06-02",
  },
  {
    title: "Talkwalker: Themes",
    description:
      "Check total engagement and reach for our campaigns: #CommunityConnect and #AUSUnplugged.",
    status: "Completed",
    assigned: "2026-06-02",
    completed: "2026-06-04",
    note: 'Created the "Topic" tracking these campaign hashtags with boolean queries; double-checked with Adil, who was reviewing it. (Completed 04 Jun 2026)',
  },
  {
    title: "Graduation Plan Brainstorming",
    description: "Finalize the graduation content ideas, video list, and filming schedule (with Larissa).",
    status: "Completed",
    assigned: "2026-06-02",
    completed: "2026-06-02",
  },
  {
    title: "Athletics Video",
    description: "Work on editing the athletics video filmed yesterday.",
    status: "Completed",
    assigned: "2026-06-03",
    completed: "2026-06-05",
    note: "Compiling and cutting the clips, choosing the right audio, starting the edits.",
  },
  {
    title: "Talkwalker: Demographic",
    description: "Check demographics data to map out audience age groups, gender split, and locations.",
    status: "Completed",
    assigned: "2026-06-03",
    completed: "2026-06-04",
    note: "Talked with Adil — Talkwalker isn't tracking channel demographics for age/gender; setting up a meeting with the Talkwalker team. Locations show, still tightening the data.",
  },
  {
    title: "AI Video",
    description: "Create and edit the AI-focused video for the Summer Semester Update post.",
    status: "Completed",
    assigned: "2026-06-03",
    completed: "2026-06-04",
    note: "Waiting on approval.",
  },
  {
    title: "Talkwalker: Demographic (Follow-up)",
    description:
      "Follow up on the demographic data gap from Day 3 — confirm the Talkwalker team meeting is set.",
    status: "Completed",
    assigned: "2026-06-04",
    completed: "2026-06-08",
    note: "Meeting with the Talkwalker team to be scheduled to resolve age/gender demographic tracking.",
  },
  {
    title: "AUS Affiliated Instagram Account Sourcing",
    description:
      "Source and compile all AUS-affiliated Instagram accounts across clubs, departments, and student orgs. Build a master list for the social media audit.",
    status: "Completed",
    assigned: "2026-06-06",
    completed: "2026-06-08",
    note: "Worked with Larissa over the weekend. ~200 new AUS-affiliated accounts identified — mainly club/department pages. Added to the master audit list.",
  },

  // ---- Week 2 · June 8–14 ----
  {
    title: "Practice Shoot",
    description: "Attend and assist with the practice shoot session.",
    status: "Completed",
    assigned: "2026-06-08",
    completed: "2026-06-08",
    note: "10:00 AM. Practice shoot session completed.",
  },
  {
    title: "Talkwalker Platform Meeting",
    description:
      "Meet with Adeel and the Talkwalker team to troubleshoot platform issues — the demographic tracking gaps from Week 1.",
    status: "Completed",
    assigned: "2026-06-08",
    completed: "2026-06-08",
    note: "11:00 AM. Met with Adeel and the Talkwalker team. Discussed demographic data tracking (age/gender not captured).",
  },
  {
    title: "Debrief with Syed",
    description: "Relay key outcomes and action points from the Talkwalker meeting to Syed.",
    status: "Completed",
    assigned: "2026-06-08",
    completed: "2026-06-08",
    note: "12:10 PM. Debriefed Syed on the meeting — issues raised and outcomes discussed.",
  },
  {
    title: "Talkwalker Platform Updates File",
    description:
      "Create a document summarizing all platform findings from the week — metrics, bugs, required fixes.",
    status: "Completed",
    assigned: "2026-06-09",
    completed: "2026-06-09",
  },
  {
    title: "HubSpot Introduction",
    description: "Log into HubSpot for an intro overview and explore how it tracks audience data.",
    status: "Completed",
    assigned: "2026-06-09",
    completed: "2026-06-09",
  },
  { title: "Visibility Portal Brainstorm", status: "Completed", assigned: "2026-06-10", completed: "2026-06-10" },
  { title: "Visibility Portal Draft Prototype", status: "Completed", assigned: "2026-06-11", completed: "2026-06-11" },

  // ---- Week 3 · June 15–21 ----
  { title: "Visibility Portal", status: "Completed", assigned: "2026-06-15", completed: "2026-06-17" },
  { title: "Graduation Content", status: "Completed", assigned: "2026-06-15", completed: "2026-06-18" },
  { title: "Talkwalker + HubSpot Analytics", status: "Completed", assigned: "2026-06-15", completed: "2026-06-17" },
  // Fast/Slow-Paced Video: original tracker had these 15→18 Jun (the Excel's
  // Week-4 placement conflicted with the real completion date).
  { title: "Fast-Paced Video", status: "Completed", assigned: "2026-06-15", completed: "2026-06-18" },
  { title: "Slow-Paced Video", status: "Completed", assigned: "2026-06-15", completed: "2026-06-18" },

  // ---- Week 5 · Jun 29 – Jul 5 ----
  {
    title: "Visibility Platform Updates",
    description:
      "Roll out the latest round of updates to the visibility portal — refine the layout, fix the issues flagged in testing, and push the improved version.",
    status: "Completed",
    assigned: "2026-06-29",
    completed: "2026-07-02",
  },
  {
    title: "Hubspot Analytics comparison to Talkwalker",
    description:
      "Compare the analytics from HubSpot against Talkwalker — line up the audience and engagement metrics, note where the two platforms diverge, and flag which source is more reliable for each data point.",
    status: "Completed",
    assigned: "2026-06-30",
    completed: "2026-07-03",
  },

  // ---- Week 6 · July 6–12 (current work, not yet completed) ----
  {
    title: "Colors Picture Post",
    description: "Gathering Photos for the Idea Requested",
    status: "In Progress",
    assigned: "2026-07-06",
  },
  {
    title: "Athletics Video",
    description: "Edit and finalize the athletics video",
    status: "In Progress",
    assigned: "2026-07-06",
  },
  {
    title: "Visibility Platform Final Updates",
    description: "Apply the final round of updates to the visibility portal, last fixes, polish.",
    status: "Not Started",
    assigned: "2026-07-06",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const userByEmail: Record<string, string> = {};
  for (const u of USERS) {
    const rec = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, active: true, passwordHash },
      create: { name: u.name, email: u.email, role: u.role, passwordHash, active: true },
    });
    userByEmail[u.email] = rec.id;
  }

  // Reset tasks/comments so re-seeding is idempotent.
  await prisma.comment.deleteMany({});
  await prisma.task.deleteMany({});

  for (const t of TASKS) {
    const assignedAt = new Date(t.assigned + "T00:00:00Z");
    const task = await prisma.task.create({
      data: {
        title: t.title,
        description: t.description ?? "",
        status: t.status,
        strategicPillar: null,
        assignedFromId: userByEmail[LARISSA],
        assignedToId: userByEmail[SAM],
        dateAssigned: assignedAt,
        dateCompleted: t.completed ? new Date(t.completed + "T00:00:00Z") : null,
      },
    });
    if (t.note) {
      await prisma.comment.create({
        data: {
          taskId: task.id,
          authorId: userByEmail[SAM],
          body: t.note,
          createdAt: assignedAt,
        },
      });
    }
  }

  const notes = TASKS.filter((t) => t.note).length;
  const done = TASKS.filter((t) => t.completed).length;
  console.log(`Seeded ${USERS.length} users, ${TASKS.length} tasks (${done} with completion dates), ${notes} notes.`);
  console.log(`Shared starter password: ${SEED_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
