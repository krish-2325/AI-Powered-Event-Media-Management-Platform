// src/lib/ai/image-tagging.ts
// FREE AI image tagging using Hugging Face Inference API
// Sign up at: https://huggingface.co/join — get a free API token
// Free tier: 30,000 requests/month, no credit card needed

import { HfInference } from "@huggingface/inference";

let hf: HfInference | null = null;

function getHF(): HfInference {
  if (!hf) {
    hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN);
  }
  return hf;
}

export interface DetectedLabel {
  name: string;
  confidence: number;
  categories: string[];
}

export interface FaceDetectionResult {
  faceCount: number;
  hasFaces: boolean;
  faceDetails: Array<{
    boundingBox: { left: number; top: number; width: number; height: number };
    confidence: number;
  }>;
}

/**
 * Detect image labels using Hugging Face ViT image classification.
 * Model: google/vit-base-patch16-224 — free, open-source, runs on HF servers.
 */
export async function detectImageLabels(
  imageUrl: string
): Promise<DetectedLabel[]> {
  try {
    const client = getHF();

    // Use BLIP image captioning + ViT classification
    const results = await client.imageClassification({
      model: "google/vit-base-patch16-224",
      data: imageUrl,
    });

    return results
      .filter((r) => r.score >= 0.05)
      .slice(0, 15)
      .map((r) => ({
        name: r.label.toLowerCase().replace(/_/g, " ").split(",")[0].trim(),
        confidence: Math.round(r.score * 100),
        categories: [],
      }));
  } catch (error) {
    console.error("[detectImageLabels] HuggingFace error:", error);
    // Return empty — non-critical, tagging fails gracefully
    return [];
  }
}

/**
 * Generate an AI caption using BLIP image captioning model.
 * Model: Salesforce/blip-image-captioning-base — free on Hugging Face.
 */
export async function generateCaption(imageUrl: string): Promise<string> {
  try {
    const client = getHF();

    const result = await client.imageToText({
      model: "Salesforce/blip-image-captioning-base",
      data: imageUrl,
    });

    return result.generated_text ?? "";
  } catch (error) {
    console.error("[generateCaption] HuggingFace error:", error);
    return "";
  }
}

/**
 * Detect faces using face-api.js descriptor similarity.
 * NOTE: face-api.js runs CLIENT-SIDE in the browser.
 * Server-side we use a heuristic from the image classification labels.
 */
export async function detectFaces(imageUrl: string): Promise<FaceDetectionResult> {
  try {
    const labels = await detectImageLabels(imageUrl);
    const hasFaces = labels.some((l) =>
      ["person", "people", "face", "human", "crowd", "man", "woman", "boy", "girl", "portrait"].some(
        (kw) => l.name.includes(kw)
      )
    );
    return {
      faceCount: hasFaces ? 1 : 0,
      hasFaces,
      faceDetails: [],
    };
  } catch {
    return { faceCount: 0, hasFaces: false, faceDetails: [] };
  }
}

/**
 * Build a readable caption from detected labels (fallback when BLIP unavailable).
 */
export function generateCaptionFromLabels(labels: DetectedLabel[]): string {
  if (labels.length === 0) return "";

  const top = labels
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
    .map((l) => l.name);

  const hasPerson = top.some((l) =>
    ["person", "people", "face", "crowd", "portrait"].some((kw) => l.includes(kw))
  );

  const indianScenes = [
    "festival", "celebration", "temple", "mountain", "river", "crowd",
    "street", "market", "ghat", "stage"
  ];
  const scene = top.find((l) => indianScenes.some((kw) => l.includes(kw)));

  if (hasPerson && scene) return `People at a ${scene} event`;
  if (hasPerson) return "People at the club event";
  if (top.length > 0) return top.slice(0, 3).join(", ");
  return "Event photo";
}
