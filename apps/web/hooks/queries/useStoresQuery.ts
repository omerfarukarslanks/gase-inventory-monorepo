import { useQuery } from "@tanstack/react-query";
import { getStores, type Store } from "@/lib/stores";

export function useStoresQuery(): Store[] {
  const token = typeof window !== "undefined" ? (localStorage.getItem("token") ?? "") : "";
  const { data } = useQuery({
    queryKey: ["stores", token],
    queryFn: () => getStores({ token, page: 1, limit: 100 }),
    enabled: Boolean(token),
    select: (res) => res.data,
  });
  return data ?? [];
}
