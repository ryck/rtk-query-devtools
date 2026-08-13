import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline";
}

export function Button({ className, variant = "outline", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "solid"
          ? "bg-amber text-ink hover:bg-amber/85"
          : "border border-panel-line text-paper hover:border-mist",
        className,
      )}
      {...props}
    />
  );
}
