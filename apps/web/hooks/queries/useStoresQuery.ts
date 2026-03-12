import { useQuery } from "@tanstack/react-query";
import { getStores, type Store } from "@/lib/stores";
import { readSessionToken } from "@/lib/session";

export function useStoresQuery(): Store[] {
  const token = readSessionToken() ?? "";
  const { data } = useQuery({
    queryKey: ["stores", token],
    queryFn: () => getStores({ token, page: 1, limit: 100 }),
    enabled: Boolean(token),
    select: (res) => res.data,
  });
  return data ?? [];
}
