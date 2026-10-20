"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  Palette,
  Wand2,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { StikkyLogo } from "@/components/brand/stikky-logo";
import { logout } from "@/app/admin/login/actions";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/designs", label: "Designs", icon: Palette },
  { href: "/admin/custom-requests", label: "Custom Requests", icon: Wand2 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <StikkyLogo variant="icon" label="Stikky" className="h-9 text-foreground" />
      <span className="font-semibold text-foreground text-[15px] tracking-tight">
        Admin
      </span>
    </div>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
      <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Menu
      </p>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="w-[18px] h-[18px]" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeLabel =
    NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))?.label ??
    "Dashboard";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] h-screen sticky top-0 flex-col border-r border-border bg-card shrink-0">
        <div className="h-16 px-5 flex items-center border-b border-border">
          <Brand />
        </div>
        <NavLinks pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[260px] flex flex-col border-r border-border bg-card">
            <div className="h-16 px-5 flex items-center justify-between border-b border-border">
              <Brand />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 md:px-8 flex items-center justify-between border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-muted-foreground hover:text-foreground"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground tracking-tight">{activeLabel}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => logout()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
