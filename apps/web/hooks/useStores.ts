import { useEffect, useState } from "react";
import { getStores, type Store } from "@/lib/stores";

/**
 * Fetches all stores (page 1, limit 100) on mount.
 * Returns the store list.
 */
export function useStores(): Store[] {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    getStores({ token, page: 1, limit: 100 })
      .then((res) => setStores(res.data))
      .catch(() => setStores([]));
  }, []);

  return stores;
}
