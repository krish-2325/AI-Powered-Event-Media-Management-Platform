// src/lib/hooks/use-upload.ts
"use client";

import { useCallback } from "react";
import { nanoid } from "nanoid";
import { useUploadStore } from "@/store/upload-store";
import { isAllowedMediaType, getMaxFileSize } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";

interface UseUploadOptions {
  eventId: string;
  albumId?: string;
  onComplete?: (mediaIds: string[]) => void;
}

export function useUpload({ eventId, albumId, onComplete }: UseUploadOptions) {
  const { addUpload, updateUpload } = useUploadStore();

  const upload = useCallback(
    async (files: File[]) => {
      // Validate files
      const validFiles: File[] = [];
      for (const file of files) {
        if (!isAllowedMediaType(file.type)) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported format`,
            variant: "error",
          });
          continue;
        }
        const maxSize = getMaxFileSize(file.type);
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the maximum size`,
            variant: "error",
          });
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      // Register uploads in store
      const uploadEntries = validFiles.map((file) => ({
        id: nanoid(),
        file,
      }));

      uploadEntries.forEach(({ id, file }) => addUpload(id, file));

      try {
        // Get presigned URLs
        const res = await fetch("/api/media/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            albumId,
            files: validFiles.map((f) => ({
              name: f.name,
              type: f.type,
              size: f.size,
            })),
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to get upload URLs");
        }

        const { data: presignedUrls } = await res.json();
        const completedMediaIds: string[] = [];

        // Upload in parallel batches of 5
        const BATCH = 5;
        for (let i = 0; i < uploadEntries.length; i += BATCH) {
          const batch = uploadEntries.slice(i, i + BATCH);

          await Promise.allSettled(
            batch.map(async ({ id, file }, batchIdx) => {
              const presigned = presignedUrls[i + batchIdx];
              if (!presigned) {
                updateUpload(id, { status: "error", error: "No upload URL" });
                return;
              }

              updateUpload(id, { status: "uploading", progress: 0 });

              try {
                await new Promise<void>((resolve, reject) => {
                  const xhr = new XMLHttpRequest();
                  xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                      updateUpload(id, {
                        progress: Math.round((e.loaded / e.total) * 100),
                      });
                    }
                  };
                  xhr.onload = () =>
                    xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`));
                  xhr.onerror = () => reject(new Error("Network error"));
                  xhr.open("PUT", presigned.uploadUrl);
                  xhr.setRequestHeader("Content-Type", file.type);
                  xhr.send(file);
                });

                // Confirm upload with server
                await fetch(`/api/media/${presigned.mediaId}/confirm`, {
                  method: "POST",
                });

                updateUpload(id, {
                  status: "done",
                  progress: 100,
                  mediaId: presigned.mediaId,
                });
                completedMediaIds.push(presigned.mediaId);
              } catch (err) {
                updateUpload(id, {
                  status: "error",
                  error: err instanceof Error ? err.message : "Upload failed",
                });
              }
            })
          );
        }

        if (completedMediaIds.length > 0) {
          toast({
            title: `${completedMediaIds.length} file${completedMediaIds.length > 1 ? "s" : ""} uploaded`,
            variant: "success",
          });
          onComplete?.(completedMediaIds);
        }
      } catch (err) {
        uploadEntries.forEach(({ id }) =>
          updateUpload(id, { status: "error", error: "Upload failed" })
        );
        toast({ title: "Upload failed", description: "Please try again", variant: "error" });
      }
    },
    [eventId, albumId, addUpload, updateUpload, onComplete]
  );

  return { upload };
}
