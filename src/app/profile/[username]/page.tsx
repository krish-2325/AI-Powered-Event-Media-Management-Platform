// src/app/profile/[username]/page.tsx

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { MediaGallery } from "@/components/media/media-gallery";
import { formatDate, formatNumber } from "@/lib/utils";
import { USER_ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/types/user";

interface Props {
  params: { username: string };
}

async function getUserProfile(username: string, viewerId?: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      memberships: {
        include: { club: { select: { id: true, name: true, slug: true, logoUrl: true } } },
      },
      _count: {
        select: {
          uploadedMedia: true,
          followers: true,
          following: true,
          ownedEvents: true,
        },
      },
    },
  });

  if (!user || user.isBanned) return null;

  const [media, isFollowing] = await Promise.all([
    prisma.media.findMany({
      where: {
        uploaderId: user.id,
        accessLevel: viewerId ? { in: ["PUBLIC", "MEMBERS_ONLY"] } : "PUBLIC",
      },
      orderBy: { createdAt: "desc" },
      take: 24,
      include: {
        uploader: { select: { id: true, name: true, username: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true, shares: true, favorites: true } },
      },
    }),
    viewerId
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
        })
      : null,
  ]);

  return { user, media, isFollowing: !!isFollowing };
}

export async function generateMetadata({ params }: Props) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: { name: true, bio: true },
  });
  return { title: user?.name ?? "Profile", description: user?.bio ?? undefined };
}

export default async function ProfilePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const result = await getUserProfile(params.username, session?.user?.id);

  if (!result) notFound();

  const { user, media, isFollowing } = result;
  const isOwnProfile = session?.user?.id === user.id;

  return (
    <div className="page-container">
      {/* Profile header */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
        {/* Cover */}
        <div className="relative h-32 bg-gradient-to-r from-brand-600 to-brand-800">
          {user.coverUrl && (
            <Image src={user.coverUrl} alt="Cover" fill className="object-cover" />
          )}
        </div>

        {/* Info */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl border-4 border-card overflow-hidden bg-primary/10 flex-shrink-0">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.name} width={80} height={80} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-12">
              {isOwnProfile ? (
                <Link
                  href="/profile/settings"
                  className="px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Edit Profile
                </Link>
              ) : session?.user ? (
                <FollowButton
                  targetId={user.id}
                  isFollowing={isFollowing}
                />
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display text-foreground">{user.name}</h1>
              <span className="tag-pill">{USER_ROLE_LABELS[user.role]}</span>
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            {user.bio && (
              <p className="text-sm text-foreground mt-1 max-w-lg">{user.bio}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Joined {formatDate(user.createdAt)}
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-border">
            {[
              { label: "Photos", value: user._count.uploadedMedia },
              { label: "Events", value: user._count.ownedEvents },
              { label: "Followers", value: user._count.followers },
              { label: "Following", value: user._count.following },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-foreground">{formatNumber(s.value)}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Clubs */}
          {user.memberships.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {user.memberships.map((m) => (
                <Link
                  key={m.clubId}
                  href={`/clubs/${m.club.slug}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
                >
                  {m.club.logoUrl && (
                    <Image src={m.club.logoUrl} alt={m.club.name} width={14} height={14} className="rounded-full" />
                  )}
                  {m.club.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Media grid */}
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Photos ({user._count.uploadedMedia})
      </h2>
      <MediaGallery media={media as any} />
    </div>
  );
}

// Client component for follow button
function FollowButton({ targetId, isFollowing }: { targetId: string; isFollowing: boolean }) {
  return (
    <button
      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
