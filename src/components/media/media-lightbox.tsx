// src/components/media/media-lightbox.tsx
"use client";

import { useEffect, useCallback } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Download from "yet-another-react-lightbox/plugins/download";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/captions.css";
import type { MediaWithRelations } from "@/lib/types/media";

interface MediaLightboxProps {
  media: MediaWithRelations[];
  initialIndex: number;
  onClose: () => void;
}

export function MediaLightbox({ media, initialIndex, onClose }: MediaLightboxProps) {
  const slides = media.map((item) => ({
    src: item.originalUrl,
    alt: item.title ?? item.aiCaption ?? "Photo",
    title: item.title ?? undefined,
    description: item.aiCaption ?? undefined,
    download: item.originalUrl,
    width: item.width ?? undefined,
    height: item.height ?? undefined,
  }));

  return (
    <Lightbox
      open
      close={onClose}
      index={initialIndex}
      slides={slides}
      plugins={[Zoom, Download, Thumbnails, Captions]}
      zoom={{ maxZoomPixelRatio: 4 }}
      thumbnails={{ position: "bottom" }}
      captions={{ showToggle: true }}
      styles={{
        container: { backgroundColor: "rgba(0, 0, 0, 0.95)" },
      }}
    />
  );
}
