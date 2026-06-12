// src/app/events/create/page.tsx

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { hasRole } from "@/lib/auth/helpers";
import { CreateEventForm } from "@/components/events/create-event-form";
import type { UserRole } from "@/lib/types/user";

export const metadata = { title: "Create Event" };

export default async function CreateEventPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const userRole = session.user.role as UserRole;
  if (!hasRole(userRole, "CLUB_MEMBER")) {
    redirect("/dashboard");
  }

  return (
    <div className="page-container max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">Create New Event</h1>
        <p className="page-description">
          Set up an event to start uploading and organizing media
        </p>
      </div>
      <div className="bg-card rounded-2xl border border-border p-6 lg:p-8">
        <CreateEventForm />
      </div>
    </div>
  );
}
