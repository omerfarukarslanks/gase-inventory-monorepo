import { useCallback, useEffect, useState } from "react";
import { getStores, type Store } from "@gase/core";

export function useStoreList() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStores();
      setStores(res.data ?? []);
    } catch {
      setError("Mağazalar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stores, loading, error, refetch: fetch };
}
