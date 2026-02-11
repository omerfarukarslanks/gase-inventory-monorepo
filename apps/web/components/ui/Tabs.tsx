"use client";

import { cn } from "@/lib/cn";

export type TabItem = {
  key: string;
  label: string;
  onClick?: () => void;
};

type TabsProps = {
  items: TabItem[];
  activeKey: string;
  className?: string;
};

export default function Tabs({ items, activeKey, className }: TabsProps) {
  return (
    <div className={cn("flex rounded-[12px] border border-border bg-surface2 p-1", className)}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={item.onClick}
          className={cn(
            "flex-1 rounded-[9px] py-3 text-[14px] font-semibold tracking-[0.2px] transition-all cursor-pointer duration-250",
            activeKey === item.key
              ? "bg-primary/10 text-primary"
              : "text-muted font-medium hover:text-text2"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
