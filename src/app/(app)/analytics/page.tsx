import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Analytics } from "@/components/Analytics";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");
  // Analytics is managers-only.
  if (session.user.role !== "manager") redirect("/tasks");
  return <Analytics />;
}
