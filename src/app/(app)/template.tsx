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
    // Two things can push a fresh screen down after we reset it: streamed content settling, and on iOS the
    // leftover momentum of a flick on the previous screen (tapping mid-glide carries the glide over).
    // For a moment, hold the top against both — unless the person starts scrolling on this screen.
    let touched = false;
    const stop = () => (touched = true);
    const hold = () => {
      if (!touched && window.scrollY > 0) window.scrollTo(0, 0);
    };
    const observer = new ResizeObserver(hold);
    observer.observe(document.body);
    const frame = requestAnimationFrame(hold);
    const opts = { passive: true, once: true } as const;
    window.addEventListener("scroll", hold, { passive: true });
    window.addEventListener("touchstart", stop, opts);
    window.addEventListener("wheel", stop, opts);
    window.addEventListener("keydown", stop, opts);
    const release = () => {
      observer.disconnect();
      window.removeEventListener("scroll", hold);
    };
    const done = setTimeout(release, 1500);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(done);
      release();
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
