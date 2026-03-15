import { getStores, type Store } from "@gase/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { SegmentedControl, type SegmentItem } from "@/src/components/ui";
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

type SalesSegment = "list" | "payments" | "returns";
import { SalesListView } from "./SalesListView";
import { SaleDetailView } from "./SaleDetailView";
import { SalesComposer } from "./SalesComposer";
import { PaymentsListView } from "./PaymentsListView";
import { ReturnsListView } from "./ReturnsListView";

type SalesScreenProps = {
  isActive?: boolean;
  request?: RequestEnvelope<SalesRequest> | null;
};

export default function SalesScreen({ isActive = true, request }: SalesScreenProps = {}) {
  const handledRequestId = useRef<number | null>(null);
  const { storeIds, can } = useAuth();
  const [view, setView] = useState<SalesView>("list");
  const [segment, setSegment] = useState<SalesSegment>("list");
  const [stores, setStores] = useState<Store[]>([]);

  const canViewPayments = can("SALE_PAYMENT_READ");
  const canViewReturns = can("SALE_RETURN_READ");

  const segments = useMemo<SegmentItem[]>(() => {
    const items: SegmentItem[] = [{ key: "list", label: "Satislar" }];
    if (canViewPayments) items.push({ key: "payments", label: "Tahsilatlar" });
    if (canViewReturns) items.push({ key: "returns", label: "Iadeler" });
    return items;
  }, [canViewPayments, canViewReturns]);

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

  // Show segment control only in list view (not detail/compose)
  if (segment === "payments" && canViewPayments) {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <SegmentedControl segments={segments} activeKey={segment} onChange={(k) => setSegment(k as SalesSegment)} />
        </View>
        <PaymentsListView isActive={isActive} />
      </View>
    );
  }

  if (segment === "returns" && canViewReturns) {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <SegmentedControl segments={segments} activeKey={segment} onChange={(k) => setSegment(k as SalesSegment)} />
        </View>
        <ReturnsListView isActive={isActive} />
      </View>
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
      segmentControl={
        segments.length > 1 ? (
          <SegmentedControl segments={segments} activeKey={segment} onChange={(k) => setSegment(k as SalesSegment)} />
        ) : undefined
      }
    />
  );
}
