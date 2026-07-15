import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Shell } from "@/components/Shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");

  return (
    <Shell
      me={{
        id: session.user.id,
        name: session.user.name ?? "",
        role: session.user.role,
      }}
    >
      {children}
    </Shell>
  );
}
