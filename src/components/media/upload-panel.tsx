// src/components/media/upload-panel.tsx
"use client";

import { CheckCircle2, XCircle, Loader2, X, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn, formatBytes, truncate } from "@/lib/utils";
import { useUploadStore } from "@/store/upload-store";

export function UploadPanel() {
  const { uploads, isUploadPanelOpen, clearCompleted, closeUploadPanel } = useUploadStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const uploadList = Object.entries(uploads);

  if (!isUploadPanelOpen || uploadList.length === 0) return null;

  const activeCount = uploadList.filter(
    ([, u]) => u.status === "uploading" || u.status === "processing"
  ).length;
  const completedCount = uploadList.filter(([, u]) => u.status === "done").length;
  const errorCount = uploadList.filter(([, u]) => u.status === "error").length;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : errorCount > 0 ? (
            <XCircle className="w-4 h-4 text-destructive" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
          <span className="text-sm font-semibold text-foreground">
            {activeCount > 0
              ? `Uploading ${activeCount} file${activeCount > 1 ? "s" : ""}…`
              : `${completedCount} uploaded${errorCount > 0 ? `, ${errorCount} failed` : ""}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={closeUploadPanel}
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* File list */}
      {!isCollapsed && (
        <>
          <div className="max-h-60 overflow-y-auto divide-y divide-border">
            {uploadList.map(([id, upload]) => (
              <div key={id} className="flex items-center gap-3 px-4 py-2.5">
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {upload.status === "done" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : upload.status === "error" ? (
                    <XCircle className="w-4 h-4 text-destructive" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {truncate(upload.file.name, 28)}
                  </p>
                  {upload.status === "error" ? (
                    <p className="text-xs text-destructive truncate">{upload.error}</p>
                  ) : upload.status === "done" ? (
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(upload.file.size)}
                    </p>
                  ) : (
                    <div className="mt-1">
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full bg-primary rounded-full transition-all duration-300",
                            upload.status === "processing" && "animate-pulse"
                          )}
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {upload.progress}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer actions */}
          {completedCount > 0 && (
            <div className="px-4 py-2 border-t border-border">
              <button
                onClick={clearCompleted}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear completed
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
