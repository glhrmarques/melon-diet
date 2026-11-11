import type { ComponentPropsWithoutRef } from "react";

export type BottomBarProps = ComponentPropsWithoutRef<"button">;

/** Sticky page action bar. Pass type="submit" to submit a containing form. */
export function BottomBar({ children, type = "button", className = "", ...buttonProps }: BottomBarProps) {
  return (
    <footer className="sticky bottom-0 z-20 flex shrink-0 justify-end border-t border-black/20 bg-white px-6 py-4 md:px-10">
      <button
        {...buttonProps}
        type={type}
        className={`h-[48px] w-full max-w-[219px] cursor-pointer rounded-2xl bg-black px-4 font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {children}
      </button>
    </footer>
  );
}
