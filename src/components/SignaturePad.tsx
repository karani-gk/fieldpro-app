"use client";

// The customer signs on the technician's screen with a finger. The drawing is sent as a PNG data
// URL with "Sign Off On Site"; the server stores it as a private file (services/job_flow.py).

import { useEffect, useRef } from "react";

export default function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  // A ref, not state: pointerup must see the ink drawn by the pointermove just before it.
  const hasInk = useRef(false);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = e.currentTarget.width / rect.width;
    return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale };
  };

  return (
    <div>
      <canvas
        ref={canvas}
        width={600}
        height={220}
        aria-label="Signature"
        className="w-full touch-none rounded-lg border-2 border-dashed border-slate-300 bg-white"
        onPointerDown={(e) => {
          drawing.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const ctx = e.currentTarget.getContext("2d")!;
          const { x, y } = point(e);
          ctx.beginPath();
          ctx.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = e.currentTarget.getContext("2d")!;
          const { x, y } = point(e);
          ctx.lineTo(x, y);
          ctx.stroke();
          hasInk.current = true;
        }}
        onPointerUp={(e) => {
          drawing.current = false;
          onChange(hasInk.current ? e.currentTarget.toDataURL("image/png") : null);
        }}
      />
      <button
        type="button"
        className="mt-2 text-sm text-slate-500 underline"
        onClick={() => {
          const c = canvas.current!;
          c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
          hasInk.current = false;
          onChange(null);
        }}
      >
        Clear
      </button>
    </div>
  );
}
