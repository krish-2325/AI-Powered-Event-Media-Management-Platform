// src/components/media/media-uploader.tsx
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { nanoid } from "nanoid";
import {
  Upload, X, CheckCircle2, AlertCircle, Loader2,
  Image as ImageIcon, Film, Eye,
} from "lucide-react";
import { cn, formatBytes, isAllowedMediaType, getMaxFileSize, isImageFile } from "@/lib/utils";
import { useUploadStore } from "@/store";
import { toast } from "@/lib/hooks/use-toast";

interface PreviewFile {
  id: string;
  file: File;
  previewUrl: string | null;
  isVideo: boolean;
}

interface MediaUploaderProps {
  eventId: string;
  albumId?: string;
  onUploadComplete?: (mediaIds: string[]) => void;
  maxFiles?: number;
}

export function MediaUploader({
  eventId,
  albumId,
  onUploadComplete,
  maxFiles = 50,
}: MediaUploaderProps) {
  const { addUpload, updateUpload } = useUploadStore();
  const [isUploading, setIsUploading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const generatePreviews = useCallback((files: File[]): Promise<PreviewFile[]> => {
    return Promise.all(
      files.map((file) =>
        new Promise<PreviewFile>((resolve) => {
          const id = nanoid();
          if (isImageFile(file.type)) {
            const reader = new FileReader();
            reader.onload = (e) =>
              resolve({ id, file, previewUrl: e.target?.result as string, isVideo: false });
            reader.readAsDataURL(file);
          } else {
            resolve({ id, file, previewUrl: null, isVideo: true });
          }
        })
      )
    );
  }, []);

  /**
   * Upload a single file directly to Cloudinary using signed params.
   * Cloudinary free tier: 25 GB storage, no credit card needed.
   */
  const uploadToCloudinary = async (
    file: File,
    uploadParams: {
      uploadUrl: string;
      signature: string;
      timestamp: number;
      apiKey: string;
      cloudName: string;
      publicId: string;
      folder: string;
    },
    onProgress: (pct: number) => void
  ): Promise<{ secureUrl: string; publicId: string; width?: number; height?: number }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", uploadParams.apiKey);
      formData.append("timestamp", String(uploadParams.timestamp));
      formData.append("signature", uploadParams.signature);
      formData.append("public_id", uploadParams.publicId);
      formData.append("folder", uploadParams.folder);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve({
            secureUrl: data.secure_url,
            publicId: data.public_id,
            width: data.width,
            height: data.height,
          });
        } else {
          reject(new Error(`Cloudinary upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));

      xhr.open("POST", uploadParams.uploadUrl);
      xhr.send(formData);
    });
  };

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setIsUploading(true);
      setShowPreview(false);

      const uploadEntries = files.map((file) => {
        const id = nanoid();
        addUpload(id, file);
        return { id, file };
      });

      try {
        // Step 1: Get signed upload params from our server
        const res = await fetch("/api/media/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            albumId,
            files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
          }),
        });

        if (!res.ok) throw new Error("Failed to get upload params");
        const { data: uploadParamsList } = await res.json();

        const completedMediaIds: string[] = [];
        const BATCH = 3; // Upload 3 files at a time

        for (let i = 0; i < uploadEntries.length; i += BATCH) {
          const batch = uploadEntries.slice(i, i + BATCH);

          await Promise.allSettled(
            batch.map(async ({ id, file }, batchIdx) => {
              const params = uploadParamsList[i + batchIdx];
              if (!params) return;

              try {
                updateUpload(id, { status: "uploading", progress: 0 });

                // Step 2: Upload directly to Cloudinary
                const cloudinaryResult = await uploadToCloudinary(
                  file,
                  params,
                  (pct) => updateUpload(id, { progress: pct })
                );

                updateUpload(id, { status: "processing", progress: 100 });

                // Step 3: Confirm with our server + trigger AI pipeline
                const confirmRes = await fetch(`/api/media/${params.mediaId}/confirm`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    publicId: cloudinaryResult.publicId,
                    secureUrl: cloudinaryResult.secureUrl,
                    width: cloudinaryResult.width,
                    height: cloudinaryResult.height,
                  }),
                });

                if (!confirmRes.ok) throw new Error("Confirm failed");

                updateUpload(id, { status: "done", progress: 100, mediaId: params.mediaId });
                completedMediaIds.push(params.mediaId);
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
            title: `${completedMediaIds.length} photo${completedMediaIds.length > 1 ? "s" : ""} uploaded!`,
            description: "AI tagging is running in the background.",
            variant: "success",
          });
          onUploadComplete?.(completedMediaIds);
        }
      } catch (err) {
        uploadEntries.forEach(({ id }) =>
          updateUpload(id, { status: "error", error: "Upload failed — check your Cloudinary config" })
        );
        toast({ title: "Upload failed", description: "Check your Cloudinary credentials in .env.local", variant: "error" });
      } finally {
        setIsUploading(false);
        setPreviewFiles([]);
      }
    },
    [eventId, albumId, addUpload, updateUpload, onUploadComplete]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        return file.size <= getMaxFileSize(file.type) && isAllowedMediaType(file.type);
      });
      if (validFiles.length === 0) return;
      const previews = await generatePreviews(validFiles);
      setPreviewFiles(previews);
      setShowPreview(true);
    },
    [generatePreviews]
  );

  const removePreview = (id: string) => {
    setPreviewFiles((prev) => {
      const removed = prev.find((p) => p.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      const next = prev.filter((p) => p.id !== id);
      if (next.length === 0) setShowPreview(false);
      return next;
    });
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"],
      "video/*": [".mp4", ".webm", ".mov"],
    },
    maxFiles,
    disabled: isUploading,
  });

  // ── Preview stage ──────────────────────────────────────────
  if (showPreview && previewFiles.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Eye className="w-4 h-4 text-primary" />
            Preview — {previewFiles.length} file{previewFiles.length > 1 ? "s" : ""} selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setPreviewFiles([]); setShowPreview(false); }}
              className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => uploadFiles(previewFiles.map((p) => p.file))}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload {previewFiles.length} file{previewFiles.length > 1 ? "s" : ""}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {previewFiles.map((pf) => (
            <div key={pf.id} className="relative group aspect-square rounded-xl overflow-hidden bg-muted border border-border">
              {pf.previewUrl ? (
                <img src={pf.previewUrl} alt={pf.file.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  <Film className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Video</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5">
                <p className="text-white text-xs truncate font-medium">{pf.file.name}</p>
                <p className="text-white/70 text-xs">{formatBytes(pf.file.size)}</p>
              </div>
              <button
                onClick={() => removePreview(pf.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Total: {formatBytes(previewFiles.reduce((s, p) => s + p.file.size, 0))}
          {" · "}Uploads go directly to Cloudinary CDN — fast and free.
        </p>
      </div>
    );
  }

  // ── Drop zone ──────────────────────────────────────────────
  return (
    <div
      {...getRootProps()}
      className={cn(
        "upload-zone",
        isDragActive && !isDragReject && "drag-active",
        isDragReject && "border-destructive bg-destructive/5",
        isUploading && "opacity-70 cursor-wait"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3 text-center">
        {isUploading ? (
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        ) : isDragReject ? (
          <AlertCircle className="w-10 h-10 text-destructive" />
        ) : isDragActive ? (
          <Upload className="w-10 h-10 text-primary animate-bounce" />
        ) : (
          <div className="flex gap-2">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? "Drop files to preview" : isUploading ? "Uploading to Cloudinary…" : "Drag & drop files here"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or <span className="text-primary font-medium cursor-pointer">browse files</span>
          </p>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Images up to 20 MB</span>
          <span>·</span>
          <span>Videos up to 500 MB</span>
          <span>·</span>
          <span>Max {maxFiles} files</span>
        </div>
        <p className="text-xs text-muted-foreground/60">
          Powered by Cloudinary — free storage &amp; CDN
        </p>
      </div>
    </div>
  );
}
