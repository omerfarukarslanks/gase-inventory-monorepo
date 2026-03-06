"use client";

export type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  parentId: string;
};

export const EMPTY_FORM: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
};

export function slugifyText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[\u00E7]/g, "c")
    .replace(/[\u011F]/g, "g")
    .replace(/[\u0131]/g, "i")
    .replace(/[\u00F6]/g, "o")
    .replace(/[\u015F]/g, "s")
    .replace(/[\u00FC]/g, "u")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
