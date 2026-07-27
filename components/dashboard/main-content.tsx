"use client";

import type { Section } from "@/app/page";
import { OverviewContent } from "./content/overview-content";
import { OrdersContent } from "./content/orders-content";
import { CustomersContent } from "./content/customers-content";
import { ProductsContent } from "./content/products-content";
import { DesignsContent } from "./content/designs-content";
import { CustomRequestsContent } from "./content/custom-requests-content";
import { AnalyticsContent } from "./content/analytics-content";
import { SettingsContent } from "./content/settings-content";
import { ThemeToggle } from "./theme-toggle";

interface MainContentProps {
  activeSection: Section;
}

const sectionConfig: Record<Section, { title: string; subtitle: string }> = {
  overview: {
    title: "Dashboard",
    subtitle: "Orders, revenue & production at a glance",
  },
  orders: {
    title: "Orders",
    subtitle: "Manage orders & production workflow",
  },
  customers: {
    title: "Customers",
    subtitle: "Everyone who has ordered from Stikky",
  },
  products: {
    title: "Products",
    subtitle: "Create and manage the product catalog",
  },
  designs: {
    title: "Design Catalog",
    subtitle: "Poster & sticker designs performance",
  },
  "custom-requests": {
    title: "Custom Requests",
    subtitle: "Bespoke poster & sticker requests from customers",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Business performance & growth",
  },
  settings: {
    title: "Settings",
    subtitle: "Store, shipping & admin preferences",
  },
};

export function MainContent({ activeSection }: MainContentProps) {
  const config = sectionConfig[activeSection];

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewContent />;
      case "orders":
        return <OrdersContent />;
      case "customers":
        return <CustomersContent />;
      case "products":
        return <ProductsContent />;
      case "designs":
        return <DesignsContent />;
      case "custom-requests":
        return <CustomRequestsContent />;
      case "analytics":
        return <AnalyticsContent />;
      case "settings":
        return <SettingsContent />;
      default:
        return <OverviewContent />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Header */}
      <header className="h-16 px-8 flex items-center justify-between border-b border-border bg-card shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            {config.title}
          </h1>
          <p className="text-sm text-muted-foreground">{config.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div key={activeSection} className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
