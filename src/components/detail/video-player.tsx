"use client";

import Image from "next/image";
import { Play, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { MediaVideo } from "@/lib/media/types";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
 * The playing video lives in the URL hash (#play=<youtubeId>), so the Play button and the
 * Videos row stay independent, and the phone's Back gesture closes the player.
 */
const PREFIX = "#play=";
const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
function usePlaying() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => "");
  return hash.startsWith(PREFIX) ? decodeURIComponent(hash.slice(PREFIX.length)) : null;
}
function play(id: string) {
  // Push a history entry so Back closes the player.
  window.history.pushState({ ...window.history.state, __trailer: true }, "", `${PREFIX}${encodeURIComponent(id)}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
function close() {
  if (window.history.state?.__trailer) window.history.back();
  else {
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
}

const noop = () => () => {};

export const thumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export function PlayTrailerButton({ video }: { video: MediaVideo }) {
  return (
    <button
      type="button"
      onClick={() => play(video.youtubeId)}
      className={buttonClasses("glass", "md", "mt-5")}
    >
      <Play className="fill-current" /> Play Trailer
    </button>
  );
}

export function VideoRow({ videos }: { videos: MediaVideo[] }) {
  return (
    <section aria-label="Videos">
      <h2 className="gutter mb-3 text-[20px] font-bold tracking-[-0.02em]">Videos</h2>
      <div className="no-scrollbar gutter flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {videos.map((v) => (
          <button
            key={v.youtubeId}
            type="button"
            onClick={() => play(v.youtubeId)}
            className="group w-[72vw] shrink-0 snap-start text-left md:w-[360px]"
          >
            <div className="relative aspect-video overflow-hidden rounded-[14px] bg-elevated-2 ring-1 ring-white/[0.06]">
              <Image
                src={thumbnail(v.youtubeId)}
                alt=""
                fill
                sizes="(min-width: 768px) 360px, 72vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/10" />
              <span className="glass absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-transform group-active:scale-90">
                <Play className="size-5 translate-x-px fill-current" />
              </span>
            </div>
            <p className="mt-2 line-clamp-1 text-[13.5px] font-medium text-fg/90">{v.name}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Full-screen player overlay. Mount once per page. */
export function VideoModal({ videos }: { videos: MediaVideo[] }) {
  const playing = usePlaying();
  const video = playing ? videos.find((v) => v.youtubeId === playing) : null;
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [video]);

  if (!mounted) return null;
  // Portal to <body> so animated page wrappers can't trap the fixed overlay or put the tab bar above it.
  return createPortal(
    <AnimatePresence>
      {video && (
        <motion.div
          key="player"
          role="dialog"
          aria-modal
          aria-label={video.name}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 px-3 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <button
            type="button"
            aria-label="Close video"
            onClick={close}
            className="glass absolute top-[calc(env(safe-area-inset-top)+0.75rem)] right-4 grid size-10 place-items-center rounded-full"
          >
            <X className="size-5" />
          </button>
          <motion.div
            className={cn("relative aspect-video w-full max-w-[1100px] overflow-hidden rounded-[16px] bg-black shadow-2xl ring-1 ring-white/10")}
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
              title={video.name}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          </motion.div>
          <p className="mt-4 text-[14px] text-fg-2">{video.name}</p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ------------------------------------------------------- ambient backdrop */

const reducedMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Skip on reduced-motion or data-saver, and until the browser has mounted. */
function useAmbientAllowed() {
  return useSyncExternalStore(
    reducedMotion,
    () => {
      const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
      return !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !saveData;
    },
    () => false,
  );
}

/**
 * Silent, looping trailer behind the page header. It stays invisible until YouTube reports it's
 * actually playing, then fades in over the artwork — so a blocked or slow video never shows
 * a black box or YouTube's own UI. Paused (unmounted) while the full trailer player is open.
 */
export function TrailerBackdrop({ video }: { video: MediaVideo }) {
  const allowed = useAmbientAllowed();
  const modalOpen = usePlaying() !== null;
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const active = allowed && !modalOpen;

  useEffect(() => {
    if (!active) return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== "string") return;
      try {
        const data = JSON.parse(e.data) as { event?: string; info?: { playerState?: number; currentTime?: number } | number };
        const state = typeof data.info === "object" ? data.info?.playerState : data.event === "onStateChange" ? data.info : undefined;
        if (state === 1) setPlaying(true); // 1 = playing
      } catch {
        /* not a YouTube message */
      }
    };
    window.addEventListener("message", onMessage);
    // Ask the embed to report its state (YouTube's iframe message protocol).
    const listen = setInterval(() => {
      frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
    }, 500);
    return () => {
      window.removeEventListener("message", onMessage);
      clearInterval(listen);
      setPlaying(false);
    };
  }, [active]);

  if (!active) return null;

  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    loop: "1",
    playlist: video.youtubeId, // required for loop
    playsinline: "1",
    rel: "0",
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
    modestbranding: "1",
    start: "6", // skip most studio logos
    enablejsapi: "1",
    origin: window.location.origin,
  });

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-[1500ms] ease-out [container-type:size]",
        playing ? "opacity-100" : "opacity-0",
      )}
    >
      <iframe
        ref={frame}
        src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?${params}`}
        title=""
        tabIndex={-1}
        allow="autoplay; encrypted-media"
        // Cover the box like object-fit: cover, then over-scale to crop YouTube's edge UI.
        className="absolute top-1/2 left-1/2 h-[max(100cqh,56.25cqw)] w-[max(100cqw,177.78cqh)] -translate-x-1/2 -translate-y-1/2 scale-[1.18] border-0"
      />
    </div>
  );
}
