"use client";

import { useState } from "react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import type { AttributeValue } from "@/lib/attributes";

type VirtualAttributeValuesTableProps = {
  values: AttributeValue[];
  togglingValueIds: string[];
  onToggleValueStatus: (value: AttributeValue, next: boolean) => void;
  canUpdate: boolean;
};

export default function VirtualAttributeValuesTable({
  values,
  togglingValueIds,
  onToggleValueStatus,
  canUpdate,
}: VirtualAttributeValuesTableProps) {
  const rowHeight = 40;
  const containerHeight = 240;
  const overscan = 4;
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = values.length * rowHeight;
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(values.length, startIndex + visibleCount + overscan * 2);
  const visibleValues = values.slice(startIndex, endIndex);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="grid grid-cols-[1.5fr_1fr_0.7fr] border-b border-border bg-surface2/70 text-left text-[11px] uppercase tracking-wide text-muted">
        <div className="px-3 py-2">Deger Adi</div>
        <div className="px-3 py-2">Durum</div>
        <div className="bg-surface2/70 px-3 py-2 text-right">Islemler</div>
      </div>

      <div className="h-[240px] overflow-y-auto" onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
        <div className="relative" style={{ height: totalHeight }}>
          <div className="absolute inset-x-0" style={{ transform: `translateY(${startIndex * rowHeight}px)` }}>
            {visibleValues.map((value) => (
              <div
                key={value.id}
                className="grid h-10 grid-cols-[1.5fr_1fr_0.7fr] items-center border-b border-border text-sm text-text2 last:border-b-0 hover:bg-surface2/30"
              >
                <div className="px-3 py-2 text-text">{value.name}</div>
                <div className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      value.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                    }`}
                  >
                    {value.isActive ? "Aktif" : "Pasif"}
                  </span>
                </div>
                <div className="px-3 py-2 text-right">
                  {canUpdate && (
                    <ToggleSwitch
                      checked={value.isActive}
                      onChange={(next) => onToggleValueStatus(value, next)}
                      disabled={togglingValueIds.includes(value.id)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
