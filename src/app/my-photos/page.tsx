// src/app/my-photos/page.tsx

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { MyPhotosClient } from "@/components/ai/my-photos-client";

export const metadata = { title: "My Photos" };

async function getUserFaceDescriptor(userId: string): Promise<number[] | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { faceDescriptor: true },
  });
  return user?.faceDescriptor?.length ? user.faceDescriptor : null;
}

async function getMediaWithFaceDescriptors(userId: string) {
  // Get all images that have stored face descriptors
  const media = await prisma.media.findMany({
    where: {
      type: "IMAGE",
      faceDescriptors: { not: null },
      accessLevel: { in: ["PUBLIC", "MEMBERS_ONLY"] },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      uploader: { select: { id: true, name: true, username: true, avatarUrl: true } },
      event: { select: { id: true, title: true, slug: true } },
      _count: { select: { likes: true, comments: true, shares: true, favorites: true } },
    },
  });
  return media;
}

export default async function MyPhotosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const [faceDescriptor, allMedia] = await Promise.all([
    getUserFaceDescriptor(session.user.id),
    getMediaWithFaceDescriptors(session.user.id),
  ]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Photos</h1>
        <p className="page-description">
          Photos of you found across Techfest, Diwali walks, Holi shoots, and all club events using face recognition
        </p>
      </div>
      <MyPhotosClient
        userFaceDescriptor={faceDescriptor}
        allMedia={allMedia as any}
        userId={session.user.id}
      />
    </div>
  );
}
