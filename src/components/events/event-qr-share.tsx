// src/components/events/event-qr-share.tsx
"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Share2, Copy, Download, Check, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/lib/hooks/use-toast";

interface EventQRShareProps {
  eventSlug: string;
  eventTitle: string;
}

export function EventQRShare({ eventSlug, eventTitle }: EventQRShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/events/${eventSlug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: "Link copied!", variant: "success" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("event-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement("a");
      link.download = `${eventSlug}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: `${eventTitle} — ${APP_NAME}`,
        url: shareUrl,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
      >
        <QrCode className="w-4 h-4" />
        Share
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Share Event</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-border">
                  <QRCodeSVG
                    id="event-qr-code"
                    value={shareUrl}
                    size={180}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: "/icons/icon-192x192.png",
                      height: 36,
                      width: 36,
                      excavate: true,
                    }}
                  />
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Scan to open &quot;{eventTitle}&quot;
              </p>

              {/* URL */}
              <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl">
                <p className="flex-1 text-xs text-foreground truncate font-mono">{shareUrl}</p>
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                    copied
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share Link
                </button>
                <button
                  onClick={handleDownloadQR}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Save QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
