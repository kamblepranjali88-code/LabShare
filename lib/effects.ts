"use client";
import { gsap } from "gsap";

export function sparkleBurst(x: number, y: number, count = 14) {
  if (typeof document === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "sparkle-burst";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    gsap.to(el, {
      x: (Math.random() - 0.5) * 220,
      y: (Math.random() - 0.5) * 220,
      scale: 0,
      opacity: 0,
      rotation: Math.random() * 360,
      duration: 0.9 + Math.random() * 0.4,
      ease: "power3.out",
      onComplete: () => el.remove(),
    });
  }
}

export async function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#4F7CFF", "#22D3EE", "#A78BFA", "#FBBF24"];

  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors, scalar: 1.1 });
  setTimeout(
    () => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors }),
    150
  );
  setTimeout(
    () => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors }),
    300
  );
}
