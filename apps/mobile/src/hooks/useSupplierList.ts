import { useCallback, useEffect, useState } from "react";
import { getAllSuppliers, type Supplier } from "@gase/core";

export function useSupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSuppliers();
      setSuppliers(data);
    } catch {
      setError("Tedarikçiler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { suppliers, loading, error, refetch: fetch };
}
