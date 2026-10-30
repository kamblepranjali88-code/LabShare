"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.to(ref.current, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3,
      },
    });
  }, []);

  return (
    <div
      ref={ref}
      style={{ transformOrigin: "left center", transform: "scaleX(0)" }}
      className="fixed top-0 left-0 z-[9999] h-[2px] w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-400 shadow-[0_0_8px_#4F7CFF]"
    />
  );
}
