"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;

    dot.style.display = "block";
    ring.style.display = "block";

    const xTo = gsap.quickTo(ring, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(ring, "y", { duration: 0.4, ease: "power3.out" });

    const move = (e: MouseEvent) => {
      gsap.set(dot, { x: e.clientX, y: e.clientY });
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const onEnter = () => gsap.to(ring, { scale: 1.6, duration: 0.3, ease: "power2.out" });
    const onLeave = () => gsap.to(ring, { scale: 1, duration: 0.3, ease: "power2.out" });

    window.addEventListener("mousemove", move);

    const interactives = document.querySelectorAll("a, button, [role=button], input, select, textarea");
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      window.removeEventListener("mousemove", move);
      interactives.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        style={{ display: "none" }}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 mix-blend-difference"
      />
      <div
        ref={ringRef}
        style={{ display: "none" }}
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/60"
      />
    </>
  );
}
