import { useCallback, useEffect, useState } from "react";

type ScreenState<T> = {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

/**
 * Wraps the loading / error / empty-data trifecta for list screens.
 *
 * @example
 * const { data, loading, error, refetch } = useScreenState(() => getCustomers());
 */
export function useScreenState<T>(fetchFn: () => Promise<T[]>): ScreenState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch {
      setError("Veriler yüklenemedi. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
