/**
 * Browser-side OCR fallback. Used when no server OCR provider is configured
 * (e.g. running locally without an AI key). Lazy-loaded, never imported on the
 * server.
 */
export async function runBrowserOcr(imageDataUrl: string): Promise<{
  text: string;
  confidence: number;
  provider: string;
}> {
  const { default: Tesseract } = await import("tesseract.js");
  const result = await Tesseract.recognize(imageDataUrl, "eng");
  return {
    text: (result.data.text ?? "").trim(),
    confidence: Math.max(0, Math.min(1, (result.data.confidence ?? 0) / 100)),
    provider: "tesseract.js (on-device)",
  };
}
