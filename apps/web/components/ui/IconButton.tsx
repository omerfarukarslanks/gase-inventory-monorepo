"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
};

export default function IconButton({ children, className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
