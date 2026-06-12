// src/app/admin/clubs/page.tsx

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { hasRole } from "@/lib/auth/helpers";
import prisma from "@/lib/db/prisma";
import { AdminClubsClient } from "@/components/admin/admin-clubs-client";
import type { UserRole } from "@/lib/types/user";

export const metadata = { title: "Clubs | Admin" };

async function getClubs() {
  return prisma.club.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { members: true, events: true },
      },
    },
  });
}

export default async function AdminClubsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!hasRole(session.user.role as UserRole, "ADMIN")) redirect("/dashboard");

  const clubs = await getClubs();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Clubs</h1>
        <p className="page-description">{clubs.length} clubs registered</p>
      </div>
      <AdminClubsClient clubs={clubs as any} />
    </div>
  );
}
