// src/components/ai/my-photos-client.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Camera, Loader2, RefreshCw, UserCheck, AlertCircle } from "lucide-react";
import { MediaGallery } from "@/components/media/media-gallery";
import { FaceSelfieUpload } from "./face-selfie-upload";
import { cn } from "@/lib/utils";
import type { MediaWithRelations } from "@/lib/types/media";

interface MyPhotosClientProps {
  userFaceDescriptor: number[] | null;
  allMedia: MediaWithRelations[];
  userId: string;
}

const SIMILARITY_THRESHOLD = 0.55; // lower = stricter match

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

export function MyPhotosClient({
  userFaceDescriptor,
  allMedia,
  userId,
}: MyPhotosClientProps) {
  const [matchedMedia, setMatchedMedia] = useState<MediaWithRelations[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingDone, setMatchingDone] = useState(false);
  const [hasSelfie, setHasSelfie] = useState(!!userFaceDescriptor);

  const runFaceMatching = useCallback(async () => {
    if (!userFaceDescriptor || allMedia.length === 0) return;

    setIsMatching(true);
    setMatchingDone(false);

    // Run matching in small async batches to keep UI responsive
    const matched: MediaWithRelations[] = [];
    const BATCH = 10;

    for (let i = 0; i < allMedia.length; i += BATCH) {
      const batch = allMedia.slice(i, i + BATCH);

      for (const media of batch) {
        try {
          const descriptors = media.faceDescriptors as unknown as number[][] | null;
          if (!descriptors || descriptors.length === 0) continue;

          const isMatch = descriptors.some((desc) => {
            const dist = euclideanDistance(userFaceDescriptor, desc);
            return dist < SIMILARITY_THRESHOLD;
          });

          if (isMatch) matched.push(media);
        } catch {
          // Skip malformed descriptor
        }
      }

      // Yield control back to browser between batches
      await new Promise((r) => setTimeout(r, 0));
    }

    setMatchedMedia(matched);
    setIsMatching(false);
    setMatchingDone(true);
  }, [userFaceDescriptor, allMedia]);

  useEffect(() => {
    if (hasSelfie && userFaceDescriptor) {
      runFaceMatching();
    }
  }, [hasSelfie, userFaceDescriptor, runFaceMatching]);

  // No selfie registered yet
  if (!hasSelfie) {
    return (
      <div className="max-w-xl">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground mb-1">
                Set up Face Recognition
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload a clear selfie and PixVault will automatically find every photo of you across
                all events. Your face data stays private and is never shared.
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <FaceSelfieUpload onComplete={() => setHasSelfie(true)} />
          </div>
        </div>
      </div>
    );
  }

  // Matching in progress
  if (isMatching) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          </div>
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Scanning photos…</p>
          <p className="text-sm text-muted-foreground mt-1">
            Comparing your face against {allMedia.length} photos
          </p>
        </div>
        <div className="w-48 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  // Results
  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {matchingDone && matchedMedia.length > 0 ? (
            <>
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {matchedMedia.length} photo{matchedMedia.length !== 1 ? "s" : ""} found
                </p>
                <p className="text-xs text-muted-foreground">
                  Scanned {allMedia.length} event photos
                </p>
              </div>
            </>
          ) : matchingDone ? (
            <>
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No matches found yet</p>
                <p className="text-xs text-muted-foreground">
                  Scanned {allMedia.length} photos · Try updating your selfie for better accuracy
                </p>
              </div>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runFaceMatching}
            disabled={isMatching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isMatching && "animate-spin")} />
            Re-scan
          </button>
          <Link
            href="/profile/settings#face-recognition"
            className="text-xs text-primary hover:underline"
          >
            Update selfie
          </Link>
        </div>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <Camera className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Face matching runs entirely in your browser. New event photos are scanned automatically
          when uploaded. Results improve with a clearer, well-lit reference photo.
        </p>
      </div>

      {/* Gallery */}
      {matchedMedia.length > 0 && (
        <MediaGallery media={matchedMedia} view="masonry" />
      )}

      {matchingDone && matchedMedia.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">📷</span>
          <h3 className="text-base font-semibold text-foreground mb-1">No matches yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload a clearer selfie or wait for more event photos to be added.
            Face recognition accuracy improves with a front-facing, well-lit photo.
          </p>
        </div>
      )}
    </div>
  );
}
