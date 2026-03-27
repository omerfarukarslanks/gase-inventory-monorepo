"use client";

import Drawer from "@/components/ui/Drawer";
import { useLang } from "@/context/LangContext";
import type { User } from "@/lib/users";
import UserDetailContent from "./UserDetailContent";

type Props = {
  user: User | null;
  onClose: () => void;
};

function CloseButton({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onClose}
      className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-text"
      aria-label={t("common.closeDetail")}
      title={t("common.closeDetail")}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

export default function UserDetailDrawer({ user, onClose }: Props) {
  return (
    <Drawer open={Boolean(user)} onClose={onClose} side="bottom" mobileFullscreen>
      {user ? <UserDetailContent user={user} trailingAction={<CloseButton onClose={onClose} />} /> : null}
    </Drawer>
  );
}
