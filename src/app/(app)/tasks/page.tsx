import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { TaskBoard } from "@/components/TaskBoard";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");
  return <TaskBoard me={{ id: session.user.id, name: session.user.name ?? "", role: session.user.role }} />;
}
