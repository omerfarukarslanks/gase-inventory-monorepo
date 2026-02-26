"use client";

import TablePagination from "@/components/ui/TablePagination";

type StockPaginationProps = {
  page: number;
  totalPages: number;
  limit: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export default function StockPagination({
  page,
  totalPages,
  limit,
  total,
  loading,
  onPageChange,
  onLimitChange,
}: StockPaginationProps) {
  return (
    <TablePagination
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={limit}
      pageSizeId="stock-page-size"
      loading={loading}
      onPageChange={onPageChange}
      onPageSizeChange={onLimitChange}
    />
  );
}
