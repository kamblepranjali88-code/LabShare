"use client";
import { useEffect, useRef } from "react";

export function DotGrid({
  gap = 32,
  dotSize = 2,
  influence = 120,
}: { gap?: number; dotSize?: number; influence?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const resize = () => {
      const parent = canvas.parentElement!;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = parent.clientWidth + "px";
      canvas.style.height = parent.clientHeight + "px";
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("mousemove", onMove);

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      const { x: mx, y: my } = mouseRef.current;

      for (let x = 0; x < w; x += gap) {
        for (let y = 0; y < h; y += gap) {
          const dx = x - mx;
          const dy = y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const t = Math.max(0, 1 - dist / influence);
          const r = dotSize + t * 3;
          const alpha = 0.12 + t * 0.88;

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle =
            t > 0.1
              ? `rgba(79,124,255,${alpha})`
              : `rgba(148,163,184,${alpha * 0.25})`;
          if (t > 0.2) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#4F7CFF";
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [gap, dotSize, influence]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}
