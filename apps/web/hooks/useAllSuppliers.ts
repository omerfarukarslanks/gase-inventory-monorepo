"use client";

import { useEffect, useState } from "react";
import { getAllSuppliers, type Supplier } from "@/lib/suppliers";

export function useAllSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getAllSuppliers({ isActive: true, pageSize: 100, maxPages: 10 });
        if (cancelled) return;
        setSuppliers(data);
      } catch {
        if (cancelled) return;
        setSuppliers([]);
        setError("Tedarikciler yuklenemedi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { suppliers, loading, error };
}
