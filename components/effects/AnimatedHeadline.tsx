"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function AnimatedHeadline({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    async function animate() {
      const SplitType = (await import("split-type")).default;
      const el = ref.current!;
      const split = new SplitType(el, { types: "chars,words" });
      const ctx = gsap.context(() => {
        gsap.from(split.chars!, {
          y: 60,
          opacity: 0,
          rotateX: -90,
          stagger: 0.02,
          duration: 1,
          ease: "expo.out",
          delay: 0.3,
        });
      }, el);
      return () => {
        ctx.revert();
        split.revert();
      };
    }
    animate();
  }, []);

  return (
    <h1 ref={ref} className={className} style={{ perspective: "600px" }}>
      {text}
    </h1>
  );
}
