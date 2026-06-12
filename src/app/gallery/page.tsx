// src/app/gallery/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { GalleryClient } from "@/components/media/gallery-client";

export const metadata = { title: "Gallery" };

async function getGalleryMedia(userId?: string) {
  return prisma.media.findMany({
    where: {
      accessLevel: userId ? { in: ["PUBLIC", "MEMBERS_ONLY"] } : "PUBLIC",
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      uploader: { select: { id: true, name: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true, shares: true, favorites: true } },
    },
  });
}

export default async function GalleryPage() {
  const session = await getServerSession(authOptions);
  const media = await getGalleryMedia(session?.user?.id);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Gallery</h1>
        <p className="page-description">All event photos and videos</p>
      </div>
      <GalleryClient initialMedia={media as any} />
    </div>
  );
}
