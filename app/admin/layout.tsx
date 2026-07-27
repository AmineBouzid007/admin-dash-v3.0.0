import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Get current pathname from middleware header
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  // Allow admin login page without authentication
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const supabase = await createClient();

  // Get logged-in user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // No user -> login
  if (authError || !user) {
    redirect("/admin/login");
  }

  // Check admin role
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  // Not admin -> logout and redirect
  if (profileError || !profile?.is_admin) {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  // Authorized admin
  return <AdminShell>{children}</AdminShell>;
}
