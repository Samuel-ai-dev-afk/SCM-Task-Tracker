import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { TeamBoard } from "@/components/TeamBoard";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");
  // Team management is managers-only.
  if (session.user.role !== "manager") redirect("/tasks");
  return <TeamBoard meId={session.user.id} />;
}
