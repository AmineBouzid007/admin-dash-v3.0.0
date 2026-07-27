"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Section } from "@/app/page";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  Palette,
  BarChart3,
  Settings,
  Sticker,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDashboardStats, getCustomRequests } from "@/app/admin/actions";
import { resolveDateRange } from "@/lib/admin/date-ranges";

interface AppSidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

interface NavItem {
  id: Section;
  label: string;
  icon: LucideIcon;
  badge?: number;
  badgeColor?: "red" | "yellow" | "green";
}

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  const [pendingOrders, setPendingOrders] = useState(0);
  const [newRequests, setNewRequests] = useState(0);

  useEffect(() => {
    async function loadBadges() {
      try {
        const range = resolveDateRange("this_year");
        const [stats, requests] = await Promise.all([
          getDashboardStats(range),
          getCustomRequests(),
        ]);
        setPendingOrders(stats.pendingOrders);
        setNewRequests((requests || []).filter((r: any) => r.status === "new").length);
      } catch (err) {
        console.error("Failed to load sidebar badges", err);
      }
    }
    loadBadges();
  }, [activeSection]);

  const mainMenu: NavItem[] = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingBag, badge: pendingOrders || undefined, badgeColor: "yellow" },
    { id: "customers", label: "Customers", icon: Users },
    { id: "products", label: "Products", icon: Package },
    { id: "designs", label: "Designs", icon: Palette },
    { id: "custom-requests", label: "Custom Requests", icon: Wand2, badge: newRequests || undefined, badgeColor: "red" },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <aside className="w-[260px] h-screen bg-card border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <Sticker className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground text-[15px] tracking-tight">
          Stikky
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
        {mainMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge ? (
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] font-semibold rounded-full",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : item.badgeColor === "yellow"
                        ? "bg-warning/20 text-warning"
                        : item.badgeColor === "red"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}

        <p className="px-3 mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          System
        </p>
        <button
          type="button"
          onClick={() => onSectionChange("settings")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
            activeSection === "settings"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="w-[18px] h-[18px]" />
          <span className="flex-1 text-left">Settings</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
            ST
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Stikky Admin</p>
            <p className="text-xs text-muted-foreground truncate">admin@stikky.tn</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
