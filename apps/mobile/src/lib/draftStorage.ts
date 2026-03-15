/**
 * Persistent storage for the sales composer draft.
 * Uses expo-file-system/legacy to write a JSON file to the documents directory.
 * The draft survives app restarts and can be resumed from the Dashboard.
 */

import * as FileSystem from "expo-file-system/legacy";
import type { SalesComposerDraft } from "@/src/screens/sales/hooks/types";

const DRAFT_FILENAME = "sales-draft.json";

function getDraftPath(): string | null {
  return FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${DRAFT_FILENAME}` : null;
}

/**
 * Persist the draft to disk. Pass null to clear.
 */
export async function saveDraft(draft: SalesComposerDraft | null): Promise<void> {
  const path = getDraftPath();
  if (!path) return;
  if (draft === null) {
    await FileSystem.deleteAsync(path, { idempotent: true });
    return;
  }
  await FileSystem.writeAsStringAsync(path, JSON.stringify(draft), {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

/**
 * Load the persisted draft from disk. Returns null if none exists or on any error.
 */
export async function loadDraft(): Promise<SalesComposerDraft | null> {
  const path = getDraftPath();
  if (!path) return null;
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(path, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return JSON.parse(raw) as SalesComposerDraft;
  } catch {
    return null;
  }
}

/**
 * Check whether a persisted draft file exists (fast, no JSON parse).
 */
export async function hasSavedDraft(): Promise<boolean> {
  const path = getDraftPath();
  if (!path) return false;
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Delete the persisted draft file.
 */
export async function clearDraft(): Promise<void> {
  const path = getDraftPath();
  if (!path) return;
  await FileSystem.deleteAsync(path, { idempotent: true });
}
