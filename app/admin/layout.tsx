import type { ReactNode } from "react";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/admin-shell";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}

// Server Component by default — the shell itself (sidebar/header) needs
// client-side interactivity (mobile drawer, active-link highlighting),
// so that part is isolated in <AdminShell>, a client component.
//
// This layout wraps every route under /admin, INCLUDING /admin/login
// (Next.js layouts apply to all nested routes by folder structure).
// The `x-pathname` header set in middleware.ts tells us when we're on
// the login route so it can render standalone — without that check
// this layout would try to redirect /admin/login to itself.
//
// For every other /admin/* route: require a session, then confirm the
// same condition the RLS policies check — profiles.is_admin = true for
// profiles.id = auth.uid(). This keeps dashboard data fetches
// (getProducts, getCustomRequests, etc.) working, since they run under
// this same authenticated session.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
