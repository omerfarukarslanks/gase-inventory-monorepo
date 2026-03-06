"use client";

export type DrawerStep = 1 | 2;

export type EditableValue = {
  id: string;
  name: string;
  isActive: boolean;
  originalName: string;
  originalIsActive: boolean;
};

export function parseCommaSeparated(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
