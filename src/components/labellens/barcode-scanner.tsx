import { Loader2, ScanBarcode, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

export function cameraScanSupported() {
  return (
    typeof window !== "undefined" &&
    "BarcodeDetector" in window &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

/**
 * Live barcode capture using the browser's native BarcodeDetector.
 * Rendered only when supported; manual entry is always available as fallback.
 */
export function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        if (stopped) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setReady(true);

        const Detector = (window as unknown as { BarcodeDetector: BarcodeDetectorCtor })
          .BarcodeDetector;
        const detector = new Detector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "itf"],
        });

        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const found = await detector.detect(videoRef.current);
            const value = found[0]?.rawValue?.replace(/[^0-9]/g, "");
            if (value && value.length >= 8) {
              onDetected(value);
              return;
            }
          } catch {
            /* transient decode failure — keep scanning */
          }
          frame = window.setTimeout(tick, 350);
        };
        frame = window.setTimeout(tick, 400);
      } catch {
        setError("Camera access was blocked. Type the barcode number instead.");
      }
    }

    void start();
    return () => {
      stopped = true;
      window.clearTimeout(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onDetected]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-foreground/90">
      <video
        ref={videoRef}
        muted
        playsInline
        className="h-56 w-full object-cover opacity-95 sm:h-64"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-24 w-64 max-w-[80%] rounded-xl border-2 border-primary-foreground/70 shadow-[0_0_0_9999px_oklch(0_0_0/45%)]">
          <div className="animate-scanline absolute inset-x-0 h-0.5 bg-primary-glow" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-foreground/80 to-transparent px-3 py-3">
        <p className="flex items-center gap-2 text-xs font-medium text-background">
          {ready ? (
            <ScanBarcode className="size-4" aria-hidden="true" />
          ) : (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {error ?? (ready ? "Hold the barcode inside the frame" : "Starting camera…")}
        </p>
        <Button size="sm" variant="secondary" onClick={onClose}>
          <X className="size-4" aria-hidden="true" />
          Close
        </Button>
      </div>
    </div>
  );
}
