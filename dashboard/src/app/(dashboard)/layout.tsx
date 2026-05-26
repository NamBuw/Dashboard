"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileSidebar from "@/components/layout/MobileSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          onMenuClick={() => setMobileOpen(true)}
          user={{ name: "Admin", email: "admin@ptit.edu.vn", role: "SuperAdmin" }}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
