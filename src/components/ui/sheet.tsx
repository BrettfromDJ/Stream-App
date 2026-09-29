"use client";

import type { ReactNode } from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Visually hide the title (still read by screen readers). */
  hideTitle?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Bottom sheet on phones; a centered floating panel on larger screens.
 * Built on vaul (the primitive behind shadcn/ui's Drawer).
 */
export function Sheet({ open, onOpenChange, title, description, hideTitle, children, className }: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]" />
        <Drawer.Content
          className={cn(
            "glass fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-[520px] flex-col rounded-t-(--radius-sheet) outline-none",
            "sm:bottom-6 sm:rounded-(--radius-sheet) sm:after:hidden",
            className,
          )}
        >
          <div aria-hidden className="mx-auto mt-2.5 h-[5px] w-9 shrink-0 rounded-full bg-white/25" />
          <div className={cn("px-5 pt-3", hideTitle && "sr-only")}>
            <Drawer.Title className="text-[17px] font-semibold tracking-tight">{title}</Drawer.Title>
            {description ? (
              <Drawer.Description className="mt-0.5 text-[14px] text-fg-2">{description}</Drawer.Description>
            ) : (
              <Drawer.Description className="sr-only">{title}</Drawer.Description>
            )}
          </div>
          <div className="overflow-y-auto overscroll-contain px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] sm:pb-4">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
