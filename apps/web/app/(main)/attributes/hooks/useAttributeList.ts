"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAttributesPaginated,
  updateAttribute,
  updateAttributeValue,
  type Attribute,
  type AttributesPaginatedMeta,
  type AttributeValue,
} from "@/lib/attributes";
import { useDebounceStr } from "@/hooks/useDebounce";

type Options = {
  t: (key: string) => string;
};

export function useAttributeList({ t }: Options) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [meta, setMeta] = useState<AttributesPaginatedMeta | null>(null);
  const [expandedAttributeIds, setExpandedAttributeIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const debouncedSearch = useDebounceStr(searchTerm, 300);

  const [togglingAttributeIds, setTogglingAttributeIds] = useState<string[]>([]);
  const [togglingValueIds, setTogglingValueIds] = useState<string[]>([]);

  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAttributesPaginated({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        sortOrder: "DESC",
        sortBy: "createdAt",
        isActive: statusFilter,
      });
      setAttributes(res.data);
      setMeta(res.meta);
      setExpandedAttributeIds([]);
    } catch {
      setAttributes([]);
      setMeta(null);
      setError(t("attributes.loadError"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter, t]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, pageSize]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const toggleExpand = (id: string) => {
    setExpandedAttributeIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const toggleAttributeStatus = async (attribute: Attribute, next: boolean) => {
    setTogglingAttributeIds((prev) => [...prev, attribute.id]);
    setAttributes((prev) =>
      prev.map((item) => (item.id === attribute.id ? { ...item, isActive: next } : item)),
    );
    try {
      await updateAttribute(attribute.id, { isActive: next });
      setSuccess("Ozellik durumu guncellendi.");
      await fetchAttributes();
    } catch {
      setError("Ozellik durumu guncellenemedi.");
      setAttributes((prev) =>
        prev.map((item) =>
          item.id === attribute.id ? { ...item, isActive: attribute.isActive } : item,
        ),
      );
    } finally {
      setTogglingAttributeIds((prev) => prev.filter((id) => id !== attribute.id));
    }
  };

  const toggleAttributeValueStatus = async (value: AttributeValue, next: boolean) => {
    setTogglingValueIds((prev) => [...prev, value.id]);
    try {
      await updateAttributeValue(value.id, { isActive: next });
      setSuccess("Deger durumu guncellendi.");
      await fetchAttributes();
    } catch {
      setError("Deger durumu guncellenemedi.");
    } finally {
      setTogglingValueIds((prev) => prev.filter((id) => id !== value.id));
    }
  };

  const totalPages = meta?.totalPages ?? 1;

  const handlePageChange = (nextPage: number) => {
    if (loading || nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    setCurrentPage(nextPage);
  };

  const onChangePageSize = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  return {
    /* state */
    loading,
    error,
    success,
    attributes,
    meta,
    expandedAttributeIds,
    currentPage,
    pageSize,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    setSuccess,
    showAdvancedFilters,
    setShowAdvancedFilters,
    togglingAttributeIds,
    togglingValueIds,
    /* derived */
    totalPages,
    /* functions */
    fetchAttributes,
    toggleExpand,
    toggleAttributeStatus,
    toggleAttributeValueStatus,
    handlePageChange,
    onChangePageSize,
  };
}
