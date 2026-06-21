import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import DashboardShell from "./DashboardShell";

/**
 * Server gate for all dashboard pages:
 *  - must be logged in;
 *  - non-admin accounts that haven't finished the onboarding wizard (Thông tin phụ
 *    huynh + con) are pushed to /onboarding. Read fresh from DB so completing the
 *    wizard (which sets users.onboarded=true) lets the next navigation through.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let needsOnboarding = false;
  if (!session.user.is_superuser) {
    try {
      const [row] = await query<{ onboarded: boolean }>(
        `SELECT onboarded FROM users WHERE id = $1`,
        [session.user.id],
      );
      if (row && !row.onboarded) needsOnboarding = true;
    } catch {
      // DB hiccup: don't hard-block the dashboard on the gate.
    }
  }
  if (needsOnboarding) redirect("/onboarding"); // redirect() throws → keep outside try/catch

  return <DashboardShell>{children}</DashboardShell>;
}
