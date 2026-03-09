import { getStores, type Store } from "@gase/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import type { RequestEnvelope, SalesRequest } from "@/src/lib/workflows";
import { useSalesRecents } from "./hooks/useSalesRecents";
import { useSalesList } from "./hooks/useSalesList";
import { useSaleDetail } from "./hooks/useSaleDetail";
import { useSalesComposer } from "./hooks/useSalesComposer";
import { usePaymentEditor } from "./hooks/usePaymentEditor";
import { useCancelSale } from "./hooks/useCancelSale";
import { useReturnSale } from "./hooks/useReturnSale";
import { useCustomerPicker } from "./hooks/useCustomerPicker";
import { useVariantPicker } from "./hooks/useVariantPicker";
import type { SalesView } from "./hooks/types";
import { SalesListView } from "./SalesListView";
import { SaleDetailView } from "./SaleDetailView";
import { SalesComposer } from "./SalesComposer";

type SalesScreenProps = {
  isActive?: boolean;
  request?: RequestEnvelope<SalesRequest> | null;
};

export default function SalesScreen({ isActive = true, request }: SalesScreenProps = {}) {
  const handledRequestId = useRef<number | null>(null);
  const { storeIds } = useAuth();
  const [view, setView] = useState<SalesView>("list");
  const [stores, setStores] = useState<Store[]>([]);

  const recents = useSalesRecents(isActive);
  const list = useSalesList({ isActive, storeIds });
  const detail = useSaleDetail();

  const composer = useSalesComposer({
    storeIds,
    recents,
    fetchList: list.refetch,
    setView,
  });

  const { reload: reloadDetail, data: detailData } = detail;
  const { refetch: refetchList } = list;
  const onDetailSuccess = useCallback(async () => {
    if (detailData) await reloadDetail(detailData.id);
    await refetchList();
  }, [detailData, reloadDetail, refetchList]);

  const paymentEditor = usePaymentEditor({ detail: detail.data, onSuccess: onDetailSuccess });
  const cancelSale = useCancelSale({ detail: detail.data, onSuccess: onDetailSuccess });
  const returnSale = useReturnSale({ detail: detail.data, onSuccess: onDetailSuccess });

  const customerPicker = useCustomerPicker({
    onSelect: composer.selectCustomer,
    recentCustomers: recents.customers,
  });

  const variantPicker = useVariantPicker({
    onSelect: composer.selectVariant,
    scopedStoreIds: composer.scopedStoreIds,
  });

  // Load stores for the composer store picker
  useEffect(() => {
    if (!isActive) return;
    getStores({ page: 1, limit: 100 })
      .then((response) => setStores(response.data ?? []))
      .catch(() => setStores([]));
  }, [isActive]);

  const visibleStores = useMemo(
    () => (stores.length ? stores.filter((store) => !storeIds.length || storeIds.includes(store.id)) : []),
    [storeIds, stores],
  );

  // Handle cross-screen request envelope (e.g. from DashboardScreen or StockScreen)
  useEffect(() => {
    if (!request || handledRequestId.current === request.id) return;
    handledRequestId.current = request.id;
    const payload = request.payload;

    if (payload.kind === "compose") {
      composer.open(payload.seed, { reset: true });
      return;
    }

    setView("detail");
    void detail.open(payload.saleId);
  }, [request, composer, detail]);

  if (view === "detail") {
    return (
      <SaleDetailView
        detail={detail}
        paymentEditor={paymentEditor}
        cancelSale={cancelSale}
        returnSale={returnSale}
        onBack={() => {
          setView("list");
          detail.clear();
        }}
      />
    );
  }

  if (view === "compose") {
    return (
      <SalesComposer
        composer={composer}
        customerPicker={customerPicker}
        variantPicker={variantPicker}
        visibleStores={visibleStores}
        recentCustomers={recents.customers}
        recentVariants={recents.variants}
      />
    );
  }

  return (
    <SalesListView
      list={list}
      composer={composer}
      recentCustomers={recents.customers}
      onOpenDetail={(saleId) => {
        setView("detail");
        void detail.open(saleId);
      }}
      onResumeCompose={() => setView("compose")}
    />
  );
}
