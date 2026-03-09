import { cn } from "@/lib/cn";

type TableSkeletonRowsProps = {
  /** Number of skeleton rows to render (default: 5) */
  rows?: number;
  /** Number of columns to render per row (default: 4) */
  cols?: number;
  /** Width of the first column (default: "w-2/5") — useful for name-heavy tables */
  firstColWidth?: string;
  className?: string;
};

/**
 * Animated shimmer skeleton for table loading states.
 * Drop inside a `<tbody>` or as a replacement for the table body.
 *
 * @example
 * {loading ? (
 *   <TableSkeletonRows rows={5} cols={4} />
 * ) : (
 *   data.map((item) => <tr key={item.id}>...</tr>)
 * )}
 */
export default function TableSkeletonRows({
  rows = 5,
  cols = 4,
  firstColWidth = "w-2/5",
  className,
}: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className={cn("animate-pulse border-t border-border", className)}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div
                className={cn(
                  "h-4 rounded-md bg-surface2",
                  colIndex === 0 ? firstColWidth : colIndex === cols - 1 ? "w-8" : "w-3/5",
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
