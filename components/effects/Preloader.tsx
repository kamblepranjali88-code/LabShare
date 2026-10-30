"use client";
import { useEffect, useState } from "react";
import { gsap } from "gsap";

export function Preloader() {
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Only show on first visit per session
    const seen = sessionStorage.getItem("labshare-loaded");
    if (seen) { setDone(true); return; }

    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem("labshare-loaded", "1");
        setDone(true);
      },
    });
    tl.from(".preloader-logo", { scale: 0.8, opacity: 0, duration: 0.5, ease: "back.out(1.7)" })
      .to(".preloader-bar-fill", { width: "100%", duration: 1.1, ease: "power2.inOut" }, 0.2)
      .to(".preloader", { yPercent: -100, duration: 0.8, ease: "expo.inOut", delay: 0.15 });
  }, []);

  if (!mounted || done) return null;

  return (
    <div className="preloader fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gray-950">
      <div className="preloader-logo text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent select-none">
        LabShare
      </div>
      <p className="mt-2 text-sm text-gray-500 tracking-widest uppercase">Loading Platform…</p>
      <div className="mt-6 h-[2px] w-52 bg-white/10 rounded-full overflow-hidden">
        <div className="preloader-bar-fill h-full w-0 bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-400 rounded-full" />
      </div>
    </div>
  );
}
