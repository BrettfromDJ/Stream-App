import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-fg text-black hover:bg-white active:bg-white/85",
  glass: "glass text-fg hover:bg-white/10",
  soft: "bg-white/[0.08] text-fg hover:bg-white/[0.12] active:bg-white/[0.06]",
  ghost: "text-fg-2 hover:text-fg hover:bg-white/[0.06]",
  danger: "bg-danger/12 text-danger hover:bg-danger/18",
} as const;

const SIZES = {
  sm: "h-9 px-3.5 text-[14px] gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-[52px] px-6 text-[16px] gap-2",
  icon: "size-11",
  "icon-sm": "size-9",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}

export function buttonClasses(variant: keyof typeof VARIANTS = "primary", size: keyof typeof SIZES = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold tracking-[-0.01em]",
    "transition-[transform,background-color,color,opacity] duration-200 ease-(--ease-out-soft) active:scale-[0.96]",
    "disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-[1.15em] [&_svg]:shrink-0",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClasses(variant, size, className)} {...props} />;
});
