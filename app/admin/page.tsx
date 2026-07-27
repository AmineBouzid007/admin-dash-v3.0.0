"use client";

import { useState } from "react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { MainContent } from "@/components/dashboard/main-content";

export type Section =
  | "overview"
  | "orders"
  | "customers"
  | "products"
  | "designs"
  | "custom-requests"
  | "analytics"
  | "settings";

export default function AdminDashboardPage() {
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
