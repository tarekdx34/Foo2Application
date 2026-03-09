import { useEffect, useRef, useState } from "react";
import { X, Camera } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QRScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        tick();
      } catch {
        setError("تعذّر الوصول للكاميرا. تأكد من منح الإذن.");
      }
    }

    async function tick() {
      if (!active) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Dynamically import jsQR to keep initial bundle small
      const jsQR = (await import("jsqr")).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data) {
        setScanning(false);
        onScan(code.data);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onScan]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-amber-900 rounded-3xl border-4 border-amber-500 shadow-2xl w-full max-w-sm overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-amber-700">
            <div className="flex items-center gap-2">
              <Camera className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-black text-white">امسح الـ QR</h2>
            </div>
            <button
              onClick={onClose}
              className="bg-amber-700 hover:bg-amber-600 text-white rounded-full p-1.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Viewfinder */}
          <div className="relative bg-black aspect-square">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning frame overlay */}
            {scanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 relative">
                  {/* Corners */}
                  {[
                    "top-0 left-0 border-t-4 border-l-4 rounded-tl-lg",
                    "top-0 right-0 border-t-4 border-r-4 rounded-tr-lg",
                    "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg",
                    "bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg",
                  ].map((cls, i) => (
                    <div
                      key={i}
                      className={`absolute w-10 h-10 border-amber-400 ${cls}`}
                    />
                  ))}
                  {/* Scanning line */}
                  <motion.div
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-2 right-2 h-0.5 bg-amber-400 opacity-80"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6">
                <p className="text-red-400 font-bold text-center text-sm">{error}</p>
              </div>
            )}
          </div>

          <p className="text-amber-300 text-sm font-bold text-center py-4 px-4">
            {scanning && !error
              ? "وجّه الكاميرا نحو الـ QR code"
              : error
              ? "خطأ في الكاميرا"
              : "✓ تم المسح"}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
