"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { EyeIcon } from "../auth/icon";

type Props = {
  label: string;
  type: "text" | "email" | "password";
  placeholder?: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  error?: string;
};

export default function InputField({ label, type, placeholder, icon, value, onChange, error }: Props) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPw = type === "password";

  return (
    <div className="mb-5">
      <label
        className={cn(
          "mb-2 block text-[13px] font-semibold tracking-[0.3px] transition-colors duration-200",
          error ? "text-error" : "text-text2"
        )}
      >
        {label}
      </label>

      <div
        className={cn(
          "flex items-center rounded-[10px] border-[1.5px] transition-all duration-[250ms]",
          error ? "border-error" : focused ? "border-primary" : "border-border",
          focused ? "bg-primary/[0.03] shadow-[0_0_0_3px_rgba(16,185,129,0.1)]" : "bg-surface"
        )}
      >
        {icon && (
          <div className={cn("pl-3.5 flex items-center transition-colors duration-200", focused ? "text-primary" : "text-muted")}>
            {icon}
          </div>
        )}

        <input
          type={isPw && !show ? "password" : "text"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full flex-1 appearance-none bg-transparent px-3.5 py-[13px] text-[14px] text-text outline-none placeholder:text-muted"
        />

        {isPw && (
          <button
            type="button"
            onClick={() => setShow((p) => !p)}
            className="pr-3.5 flex items-center opacity-60 cursor-pointer hover:opacity-100 transition-opacity duration-200"
            aria-label="Toggle password visibility"
          >
            <EyeIcon open={show} />
          </button>
        )}
      </div>

      {error && (
        <div className="mt-1.5 flex items-center gap-1 text-[12px] text-error">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
