// src/components/ai/face-selfie-upload.tsx
"use client";

import { useState, useRef } from "react";
import { Camera, Upload, CheckCircle2, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";

interface FaceSelfieUploadProps {
  onComplete?: () => void;
  existingAvatarUrl?: string | null;
}

type Step = "idle" | "selecting" | "previewing" | "uploading" | "done";

export function FaceSelfieUpload({ onComplete, existingAvatarUrl }: FaceSelfieUploadProps) {
  const [step, setStep] = useState<Step>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "error" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "error" });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setStep("previewing");
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setStep("uploading");

    try {
      const formData = new FormData();
      formData.append("selfie", selectedFile);

      const res = await fetch("/api/users/me/face", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Upload failed");
      }

      setStep("done");
      toast({
        title: "Reference photo saved!",
        description: "We'll use this to find your photos in events.",
        variant: "success",
      });
      onComplete?.();
    } catch (err) {
      setStep("previewing");
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "error",
      });
    }
  };

  const handleReset = () => {
    setStep("idle");
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        {/* Preview / placeholder */}
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 rounded-2xl bg-secondary border-2 border-dashed border-border overflow-hidden flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : existingAvatarUrl ? (
              <img src={existingAvatarUrl} alt="Current" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          {step === "done" && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>

        {/* Info & actions */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Face Recognition Photo
          </h3>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Upload a clear selfie so PixVault can automatically find your photos from Techfest, Diwali walks, college trips, and all club events. Processed securely and never shared.
          </p>

          <div className="flex flex-wrap gap-2">
            {step === "done" ? (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Update Photo
              </button>
            ) : step === "previewing" ? (
              <>
                <button
                  onClick={handleUpload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Use This Photo
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  Choose Different
                </button>
              </>
            ) : step === "uploading" ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing…
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Upload Selfie
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
