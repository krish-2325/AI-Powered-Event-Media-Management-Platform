// src/lib/ai/image-moderation.ts
// FREE image moderation using NSFW.js (runs locally, no API key, no cloud)
// NSFW.js uses TensorFlow.js — runs entirely on your server.

export interface ModerationResult {
  isSafe: boolean;
  flaggedCategories: string[];
  confidence: number;
}

// NSFW.js categories
type NSFWCategory = "Drawing" | "Hentai" | "Neutral" | "Porn" | "Sexy";

const BLOCKED_CATEGORIES: NSFWCategory[] = ["Hentai", "Porn"];
const WARN_CATEGORIES: NSFWCategory[] = ["Sexy"];
const BLOCK_THRESHOLD = 0.6; // 60% confidence to flag
const WARN_THRESHOLD = 0.85;  // 85% confidence to flag "Sexy"

/**
 * Moderate an image for inappropriate content using NSFW.js.
 * Completely free, runs locally, no API key needed.
 *
 * IMPORTANT: NSFW.js requires a browser canvas or node-canvas.
 * For Next.js server-side, load the model lazily to avoid startup cost.
 */
export async function moderateImage(
  imageUrl: string
): Promise<ModerationResult> {
  try {
    // Dynamic import to avoid loading TF at startup
    const tf = await import("@tensorflow/tfjs-node");
    const nsfwjs = await import("nsfwjs");

    // Load model (cached after first load)
    const model = await nsfwjs.load();

    // Fetch image and convert to tensor
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    // Decode image using TF
    const imageTensor = tf.node.decodeImage(uint8, 3) as any;

    // Run inference
    const predictions = await model.classify(imageTensor);
    imageTensor.dispose();

    const flagged: string[] = [];
    let maxConfidence = 0;

    for (const pred of predictions) {
      const category = pred.className as NSFWCategory;
      const prob = pred.probability;

      if (BLOCKED_CATEGORIES.includes(category) && prob >= BLOCK_THRESHOLD) {
        flagged.push(category);
        maxConfidence = Math.max(maxConfidence, prob);
      }

      if (WARN_CATEGORIES.includes(category) && prob >= WARN_THRESHOLD) {
        flagged.push(category);
        maxConfidence = Math.max(maxConfidence, prob);
      }
    }

    return {
      isSafe: flagged.length === 0,
      flaggedCategories: flagged,
      confidence: Math.round(maxConfidence * 100),
    };
  } catch (error) {
    console.error("[moderateImage] NSFW.js error:", error);
    // Fail-open: allow image if moderation fails
    return { isSafe: true, flaggedCategories: [], confidence: 0 };
  }
}
