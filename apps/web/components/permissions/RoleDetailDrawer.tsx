"use client";

import Drawer from "@/components/ui/Drawer";
import type { RoleEntry } from "@/lib/permissions";
import RoleDetailContent from "./RoleDetailContent";

type Props = {
  role: RoleEntry | null;
  onClose: () => void;
};

export default function RoleDetailDrawer({ role, onClose }: Props) {
  return (
    <Drawer open={Boolean(role)} onClose={onClose} side="bottom" mobileFullscreen>
      {role ? (
        <RoleDetailContent
          role={role}
          trailingAction={
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-text"
              aria-label="Detayı kapat"
              title="Detayı kapat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          }
        />
      ) : null}
    </Drawer>
  );
}
