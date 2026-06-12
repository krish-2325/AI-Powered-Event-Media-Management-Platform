// src/lib/storage/image-processor.ts
// Image compression, thumbnail generation, watermarking, and blurhash

import sharp from "sharp";
import { encode as encodeBlurHash } from "blurhash";

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ThumbnailSizes {
  sm: ProcessedImage;   // 200x200
  md: ProcessedImage;   // 600px wide
  lg: ProcessedImage;   // 1200px wide
}

const THUMBNAIL_CONFIGS = {
  sm: { width: 200, height: 200, fit: "cover" as const },
  md: { width: 600, fit: "inside" as const },
  lg: { width: 1200, fit: "inside" as const },
};

/**
 * Compress and optimize an image for web
 */
export async function compressImage(
  buffer: Buffer,
  mimeType: string,
  quality = 85
): Promise<ProcessedImage> {
  let processor = sharp(buffer).rotate(); // auto-rotate based on EXIF

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    processor = processor.jpeg({ quality, mozjpeg: true });
  } else if (mimeType === "image/png") {
    processor = processor.png({ compressionLevel: 8 });
  } else if (mimeType === "image/webp") {
    processor = processor.webp({ quality });
  } else {
    // Convert everything else to webp
    processor = processor.webp({ quality });
  }

  const result = await processor.toBuffer({ resolveWithObject: true });
  return {
    buffer: result.data,
    width: result.info.width,
    height: result.info.height,
    format: result.info.format,
    size: result.info.size,
  };
}

/**
 * Generate thumbnails at multiple sizes
 */
export async function generateThumbnails(
  buffer: Buffer
): Promise<ThumbnailSizes> {
  const thumbnails = await Promise.all(
    Object.entries(THUMBNAIL_CONFIGS).map(async ([size, config]) => {
      const result = await sharp(buffer)
        .rotate()
        .resize(config.width, (config as any).height, { fit: config.fit })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });

      return [
        size,
        {
          buffer: result.data,
          width: result.info.width,
          height: result.info.height,
          format: result.info.format,
          size: result.info.size,
        },
      ] as const;
    })
  );

  return Object.fromEntries(thumbnails) as ThumbnailSizes;
}

/**
 * Generate a BlurHash placeholder for lazy loading
 */
export async function generateBlurHash(buffer: Buffer): Promise<string> {
  const { data, info } = await sharp(buffer)
    .resize(32, 32, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data);
  return encodeBlurHash(pixels, info.width, info.height, 4, 3);
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}

/**
 * Apply watermark to an image
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  watermarkText: string,
  options: {
    position?: "bottom-right" | "bottom-left" | "center";
    opacity?: number;
    fontSize?: number;
  } = {}
): Promise<Buffer> {
  const { position = "bottom-right", opacity = 0.6, fontSize = 24 } = options;

  const { width = 800, height = 600 } = await getImageDimensions(imageBuffer);

  // Create SVG watermark
  const svgText = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="black" flood-opacity="0.5"/>
        </filter>
      </defs>
      <text
        x="${position === "center" ? "50%" : position === "bottom-right" ? "95%" : "5%"}"
        y="${position === "center" ? "50%" : "95%"}"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        fill="white"
        fill-opacity="${opacity}"
        text-anchor="${position === "center" ? "middle" : position === "bottom-right" ? "end" : "start"}"
        dominant-baseline="${position === "center" ? "middle" : "auto"}"
        filter="url(#shadow)"
        transform="${position !== "center" ? "" : "rotate(-30, " + width / 2 + ", " + height / 2 + ")"}"
      >${watermarkText}</text>
    </svg>
  `;

  return sharp(imageBuffer)
    .composite([
      {
        input: Buffer.from(svgText),
        blend: "over",
      },
    ])
    .webp({ quality: 90 })
    .toBuffer();
}

/**
 * Extract video thumbnail (first frame)
 * Note: Requires ffmpeg installed on the server
 */
export async function getVideoMetadata(
  filePath: string
): Promise<{ width: number; height: number; duration: number }> {
  // In production, use fluent-ffmpeg or ffprobe
  // Returning placeholder for now
  return { width: 0, height: 0, duration: 0 };
}
