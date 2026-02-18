/**
 * Returns an array of page numbers to display in pagination.
 * Uses -1 as a sentinel for ellipsis placeholders.
 */
export function getVisiblePages(
  currentPage: number,
  totalPages: number,
): number[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, -1, totalPages];
  if (currentPage >= totalPages - 3)
    return [
      1, -1, totalPages - 4, totalPages - 3, totalPages - 2,
      totalPages - 1, totalPages,
    ];
  return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
}
