"use client";

import TablePagination from "@/components/ui/TablePagination";

type SalesPaginationProps = {
  page: number;
  totalPages: number;
  limit: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export default function SalesPagination({
  page,
  totalPages,
  limit,
  total,
  loading,
  onPageChange,
  onLimitChange,
}: SalesPaginationProps) {
  return (
    <TablePagination
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={limit}
      pageSizeId="sales-page-size"
      loading={loading}
      onPageChange={onPageChange}
      onPageSizeChange={(nextLimit) => {
        onLimitChange(nextLimit);
        onPageChange(1);
      }}
    />
  );
}
