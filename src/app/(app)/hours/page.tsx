import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { HoursBoard } from "@/components/HoursBoard";

export default async function HoursPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");

  return (
    <HoursBoard
      me={{
        id: session.user.id,
        name: session.user.name ?? "",
        role: session.user.role,
      }}
    />
  );
}
