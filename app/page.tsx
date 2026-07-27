"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { MainContent } from "@/components/dashboard/main-content";
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/admin/login");
}

export type Section =
  | "overview"
  | "orders"
  | "customers"
  | "products"
  | "designs"
  | "custom-requests"
  | "analytics"
  | "settings";

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<Section>("overview");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <MainContent activeSection={activeSection} />
    </div>
  );
}
