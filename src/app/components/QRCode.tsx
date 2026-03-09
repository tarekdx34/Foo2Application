/**
 * QRCode component — renders a QR code as SVG/canvas using the qrcode package.
 * Falls back to a styled text display if the library isn't available.
 */
import { useEffect, useRef } from "react";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCode({ value, size = 200, className = "" }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    // Dynamically import qrcode
    import("qrcode")
      .then((QRCodeLib) => {
        QRCodeLib.toCanvas(canvasRef.current!, value, {
          width: size,
          margin: 2,
          color: {
            dark: "#78350f", // amber-900
            light: "#fffbeb", // amber-50
          },
        });
      })
      .catch(() => {
        // Fallback: draw placeholder
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#fffbeb";
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = "#78350f";
        ctx.font = `bold ${size * 0.08}px Cairo, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("QR Code", size / 2, size / 2 - 10);
        ctx.fillText("(install qrcode)", size / 2, size / 2 + 20);
      });
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded-2xl border-4 border-amber-900 shadow-xl ${className}`}
    />
  );
}
