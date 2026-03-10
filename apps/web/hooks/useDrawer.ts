"use client";

import { useCallback, useState } from "react";

export interface UseDrawerReturn<TData = undefined> {
  open: boolean;
  loading: boolean;
  submitting: boolean;
  error: string;
  /** Optional domain-specific data attached to this drawer instance. */
  drawerData: TData | null;
  setOpen: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  setSubmitting: (v: boolean) => void;
  setError: (msg: string) => void;
  setDrawerData: (v: TData | null) => void;
  /** Open the drawer, optionally attaching domain data. Clears previous error. */
  openDrawer: (data?: TData) => void;
  /** Close the drawer. No-ops while submitting. Clears error and data. */
  closeDrawer: () => void;
  /**
   * Wrap an async operation with loading state.
   * Sets `loading` true, catches errors into `error`, always resets loading.
   */
  withLoad: <R>(fn: () => Promise<R>) => Promise<R | undefined>;
  /**
   * Wrap an async operation with submitting state.
   * Sets `submitting` true, catches errors into `error`, always resets submitting.
   */
  withSubmit: <R>(fn: () => Promise<R>) => Promise<R | undefined>;
}

export function useDrawer<TData = undefined>(): UseDrawerReturn<TData> {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [drawerData, setDrawerData] = useState<TData | null>(null);

  const openDrawer = useCallback((data?: TData) => {
    setError("");
    if (data !== undefined) setDrawerData(data as TData);
    setOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    if (submitting) return;
    setOpen(false);
    setError("");
    setDrawerData(null);
  }, [submitting]);

  const withLoad = useCallback(async <R>(fn: () => Promise<R>): Promise<R | undefined> => {
    setLoading(true);
    setError("");
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  const withSubmit = useCallback(async <R>(fn: () => Promise<R>): Promise<R | undefined> => {
    setSubmitting(true);
    setError("");
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return undefined;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    open,
    loading,
    submitting,
    error,
    drawerData,
    setOpen,
    setLoading,
    setSubmitting,
    setError,
    setDrawerData,
    openDrawer,
    closeDrawer,
    withLoad,
    withSubmit,
  };
}
