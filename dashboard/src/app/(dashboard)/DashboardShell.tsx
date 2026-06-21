"use client";

import { usePathname } from "next/navigation";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  // Re-key on route change so each page replays the enter animation.
  const pathname = usePathname();
  return (
    <div key={pathname} className="anim-rise">
      {children}
    </div>
  );
}
