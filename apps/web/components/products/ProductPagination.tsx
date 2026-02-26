"use client";

import TablePagination from "@/components/ui/TablePagination";

type ProductPaginationProps = {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export default function ProductPagination({
  page,
  totalPages,
  pageSize,
  total,
  loading,
  onPageChange,
  onPageSizeChange,
}: ProductPaginationProps) {
  return (
    <TablePagination
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      pageSizeId="products-page-size"
      loading={loading}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
