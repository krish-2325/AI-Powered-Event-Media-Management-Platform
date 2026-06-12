// src/app/media/[mediaId]/page.tsx

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { CommentSection } from "@/components/social/comment-section";
import { TagUsersPanel } from "@/components/media/tag-users-panel";
import { canAccessContent } from "@/lib/auth/helpers";
import { formatDate, formatBytes, formatNumber } from "@/lib/utils";
import type { AccessLevel } from "@/lib/types/event";
import type { UserRole } from "@/lib/types/user";

interface Props {
  params: { mediaId: string };
}

async function getMedia(mediaId: string) {
  return prisma.media.findUnique({
    where: { id: mediaId },
    include: {
      uploader: { select: { id: true, name: true, username: true, avatarUrl: true } },
      event: { select: { id: true, title: true, slug: true } },
      tags: {
        include: {
          taggedUser: { select: { id: true, name: true, username: true, avatarUrl: true } },
        },
      },
      _count: { select: { likes: true, comments: true, shares: true, favorites: true } },
    },
  });
}

async function getComments(mediaId: string) {
  return prisma.comment.findMany({
    where: { mediaId, parentId: null },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      replies: {
        include: {
          user: { select: { id: true, name: true, username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function generateMetadata({ params }: Props) {
  const media = await prisma.media.findUnique({
    where: { id: params.mediaId },
    select: { title: true, aiCaption: true, thumbnailUrl: true, originalUrl: true },
  });
  return {
    title: media?.title ?? media?.aiCaption ?? "Photo",
    description: media?.aiCaption ?? undefined,
    openGraph: {
      images: [{ url: media?.thumbnailUrl ?? media?.originalUrl ?? "" }],
    },
  };
}

export default async function MediaDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const media = await getMedia(params.mediaId);

  if (!media) notFound();

  const userRole = session?.user?.role as UserRole | undefined;
  const isOwner = session?.user?.id === media.uploaderId;

  if (!canAccessContent(userRole, media.accessLevel as AccessLevel, isOwner)) {
    notFound();
  }

  const comments = await getComments(params.mediaId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Main media */}
          <div>
            <div className="relative bg-black rounded-2xl overflow-hidden">
              <Image
                src={media.originalUrl}
                alt={media.title ?? media.aiCaption ?? "Photo"}
                width={media.width ?? 1200}
                height={media.height ?? 800}
                className="w-full h-auto"
                priority
              />
            </div>

            {/* Tags overlay info */}
            {media.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {media.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/profile/${tag.taggedUser.username}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    <div className="w-4 h-4 rounded-full bg-primary/20 overflow-hidden">
                      {tag.taggedUser.avatarUrl && (
                        <Image src={tag.taggedUser.avatarUrl} alt={tag.taggedUser.name} width={16} height={16} className="object-cover" />
                      )}
                    </div>
                    {tag.taggedUser.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Uploader */}
            <div className="flex items-center gap-3">
              <Link href={`/profile/${media.uploader.username}`}>
                <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden">
                  {media.uploader.avatarUrl && (
                    <Image src={media.uploader.avatarUrl} alt={media.uploader.name} width={40} height={40} className="object-cover" />
                  )}
                </div>
              </Link>
              <div>
                <Link href={`/profile/${media.uploader.username}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                  {media.uploader.name}
                </Link>
                <p className="text-xs text-muted-foreground">{formatDate(media.createdAt)}</p>
              </div>
            </div>

            {/* Title / caption */}
            {(media.title || media.aiCaption) && (
              <div>
                {media.title && <h1 className="text-base font-semibold text-foreground">{media.title}</h1>}
                {media.aiCaption && <p className="text-sm text-muted-foreground mt-1">{media.aiCaption}</p>}
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>❤️ {formatNumber(media._count.likes)} likes</span>
              <span>💬 {formatNumber(media._count.comments)} comments</span>
              <span>🔖 {formatNumber(media._count.favorites)}</span>
            </div>

            {/* AI Tags */}
            {media.aiTags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {media.aiTags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/search?q=${tag}`}
                      className="tag-pill hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Event link */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">From Event</p>
              <Link
                href={`/events/${media.event.slug}`}
                className="text-sm text-primary hover:underline font-medium"
              >
                {media.event.title}
              </Link>
            </div>

            {/* File info */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">File Info</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Size: {formatBytes(media.fileSize)}</p>
                {media.width && media.height && <p>Dimensions: {media.width} × {media.height}</p>}
                <p>Format: {media.mimeType.split("/")[1].toUpperCase()}</p>
              </div>
            </div>

            {/* Tag people */}
            <div className="border-t border-border pt-4">
              <TagUsersPanel
                mediaId={media.id}
                imageUrl={media.originalUrl}
                width={media.width ?? undefined}
                height={media.height ?? undefined}
                existingTags={media.tags as any}
                canTag={!!session?.user}
              />
            </div>

            {/* Comments */}
            <div className="border-t border-border pt-4">
              <CommentSection
                mediaId={media.id}
                initialComments={comments as any}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
