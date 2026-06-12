// src/app/admin/users/page.tsx

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { hasRole } from "@/lib/auth/helpers";
import prisma from "@/lib/db/prisma";
import { AdminUsersClient } from "@/components/admin/admin-users-client";
import type { UserRole } from "@/lib/types/user";

export const metadata = { title: "Users | Admin" };

async function getUsers(page = 1, limit = 20, q?: string) {
  const skip = (page - 1) * limit;
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { username: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        isBanned: true,
        createdAt: true,
        _count: {
          select: {
            uploadedMedia: true,
            ownedEvents: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, totalPages: Math.ceil(total / limit) };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!hasRole(session.user.role as UserRole, "ADMIN")) redirect("/dashboard");

  const page = Number(searchParams.page ?? 1);
  const { users, total, totalPages } = await getUsers(page, 20, searchParams.q);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-description">{total} registered users</p>
      </div>
      <AdminUsersClient
        users={users as any}
        total={total}
        page={page}
        totalPages={totalPages}
        query={searchParams.q}
      />
    </div>
  );
}
