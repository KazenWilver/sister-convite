import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminApp } from "@/components/admin/AdminApp";
import { isAdmin } from "@/lib/auth";
import { usingSupabase } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Convidados · Administração" };

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/entrar");
  return <AdminApp localMode={!usingSupabase} />;
}
