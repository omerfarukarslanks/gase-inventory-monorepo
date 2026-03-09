import { useCallback, useEffect, useRef, useState } from "react";
import {
  readSalesRecents,
  upsertRecentCustomer,
  upsertRecentVariant,
  writeSalesRecents,
  type SalesRecentCustomer,
  type SalesRecentVariant,
} from "@/src/lib/salesRecents";

export function useSalesRecents(isActive: boolean | undefined) {
  const customersRef = useRef<SalesRecentCustomer[]>([]);
  const variantsRef = useRef<SalesRecentVariant[]>([]);
  const [customers, setCustomers] = useState<SalesRecentCustomer[]>([]);
  const [variants, setVariants] = useState<SalesRecentVariant[]>([]);

  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  useEffect(() => {
    variantsRef.current = variants;
  }, [variants]);

  useEffect(() => {
    if (!isActive) return;
    let active = true;

    readSalesRecents()
      .then((recents) => {
        if (!active) return;
        customersRef.current = recents.customers;
        variantsRef.current = recents.variants;
        setCustomers(recents.customers);
        setVariants(recents.variants);
      })
      .catch(() => {
        if (!active) return;
        customersRef.current = [];
        variantsRef.current = [];
        setCustomers([]);
        setVariants([]);
      });

    return () => {
      active = false;
    };
  }, [isActive]);

  const persist = useCallback(
    (nextCustomers: SalesRecentCustomer[], nextVariants: SalesRecentVariant[]) => {
      void writeSalesRecents({ customers: nextCustomers, variants: nextVariants });
    },
    [],
  );

  const addCustomer = useCallback(
    (entry: SalesRecentCustomer) => {
      const next = upsertRecentCustomer(customersRef.current, entry);
      customersRef.current = next;
      setCustomers(next);
      persist(next, variantsRef.current);
    },
    [persist],
  );

  const addVariant = useCallback(
    (entry: SalesRecentVariant) => {
      const next = upsertRecentVariant(variantsRef.current, entry);
      variantsRef.current = next;
      setVariants(next);
      persist(customersRef.current, next);
    },
    [persist],
  );

  return { customers, variants, customersRef, variantsRef, addCustomer, addVariant };
}
