"use client";

import { motion } from "motion/react";
import { useLayoutEffect } from "react";

// Back/forward navigations should keep the browser's restored scroll position; everything else starts at the top.
// A timestamp rather than a flag, so effects that run twice (React dev mode) still see it.
let poppedAt = 0;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    poppedAt = Date.now();
  });
}

/** Soft fade between screens, starting each new screen at the top. */
export default function Template({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    if (Date.now() - poppedAt < 1500) return;
    window.scrollTo(0, 0);
    // Streaming content (e.g. a detail page replacing its skeleton) can nudge the position after the first
    // paint, especially on iOS. For a moment, hold the top — unless the person starts scrolling themselves.
    let touched = false;
    const stop = () => (touched = true);
    const hold = () => {
      if (!touched && window.scrollY > 0) window.scrollTo(0, 0);
    };
    const observer = new ResizeObserver(hold);
    observer.observe(document.body);
    const frame = requestAnimationFrame(hold);
    const opts = { passive: true, once: true } as const;
    window.addEventListener("touchstart", stop, opts);
    window.addEventListener("wheel", stop, opts);
    window.addEventListener("keydown", stop, opts);
    const done = setTimeout(() => observer.disconnect(), 1200);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(done);
      observer.disconnect();
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("keydown", stop);
    };
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
