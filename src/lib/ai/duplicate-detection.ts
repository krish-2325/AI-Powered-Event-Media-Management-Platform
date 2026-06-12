// src/lib/ai/duplicate-detection.ts
// Perceptual hash (pHash) based duplicate image detection
// Uses the 'sharp' library — no additional packages needed

import sharp from "sharp";

/**
 * Generate a perceptual hash (pHash) for an image buffer.
 * pHash is robust to minor edits, resizing, and compression.
 * Returns a 64-bit hash as a hex string.
 */
export async function generatePHash(buffer: Buffer): Promise<string> {
  // Resize to 32x32 grayscale for DCT computation
  const { data } = await sharp(buffer)
    .resize(32, 32, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Array.from(data);
  const size = 32;
  const smallSize = 8;

  // Apply 2D DCT (Discrete Cosine Transform)
  const dct: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  for (let u = 0; u < size; u++) {
    for (let v = 0; v < size; v++) {
      let sum = 0;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          sum +=
            pixels[i * size + j] *
            Math.cos(((2 * i + 1) * u * Math.PI) / (2 * size)) *
            Math.cos(((2 * j + 1) * v * Math.PI) / (2 * size));
        }
      }
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      dct[u][v] = (2 / size) * cu * cv * sum;
    }
  }

  // Take top-left 8x8 of DCT (low frequencies)
  const topLeft: number[] = [];
  for (let u = 0; u < smallSize; u++) {
    for (let v = 0; v < smallSize; v++) {
      topLeft.push(dct[u][v]);
    }
  }

  // Calculate mean (excluding DC component at [0,0])
  const mean =
    (topLeft.slice(1).reduce((a, b) => a + b, 0)) / (topLeft.length - 1);

  // Build hash: 1 if pixel > mean, 0 otherwise
  const hashBits = topLeft.map((v) => (v > mean ? 1 : 0));

  // Convert bits to hex string
  let hex = "";
  for (let i = 0; i < hashBits.length; i += 4) {
    const nibble = hashBits.slice(i, i + 4).reduce((a, b, idx) => a + b * Math.pow(2, 3 - idx), 0);
    hex += nibble.toString(16);
  }

  return hex;
}

/**
 * Calculate Hamming distance between two pHash hex strings.
 * 0 = identical, 64 = completely different.
 * Typical threshold for duplicates: ≤ 10
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return 64;

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const bits1 = parseInt(hash1[i], 16).toString(2).padStart(4, "0");
    const bits2 = parseInt(hash2[i], 16).toString(2).padStart(4, "0");
    for (let j = 0; j < 4; j++) {
      if (bits1[j] !== bits2[j]) distance++;
    }
  }
  return distance;
}

/**
 * Check if two hashes represent visually similar (duplicate) images.
 * threshold: Hamming distance ≤ 10 means near-duplicate
 */
export function isDuplicate(hash1: string, hash2: string, threshold = 10): boolean {
  return hammingDistance(hash1, hash2) <= threshold;
}
