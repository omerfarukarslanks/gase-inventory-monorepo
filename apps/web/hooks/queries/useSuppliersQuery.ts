import { useQuery } from "@tanstack/react-query";
import { getAllSuppliers, type Supplier } from "@/lib/suppliers";

export function useSuppliersQuery(isActive: boolean | "all" = true): Supplier[] {
  const { data } = useQuery({
    queryKey: ["suppliers", isActive],
    queryFn: () => getAllSuppliers({ isActive }),
    staleTime: 2 * 60 * 1000, // 2 minutes — reference data changes rarely
  });
  return data ?? [];
}
