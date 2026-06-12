// src/app/admin/moderation/page.tsx

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { hasRole } from "@/lib/auth/helpers";
import { ModerationPanel } from "@/components/admin/moderation-panel";
import type { UserRole } from "@/lib/types/user";

export const metadata = { title: "Content Moderation | Admin" };

export default async function ModerationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!hasRole(session.user.role as UserRole, "ADMIN")) redirect("/dashboard");

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Content Moderation</h1>
        <p className="page-description">Review AI-flagged media before it's visible to users</p>
      </div>
      <ModerationPanel />
    </div>
  );
}
