import { cn } from "@/lib/cn";

type ModeToggleProps = {
  mode: "percent" | "amount";
  onToggle: (mode: "percent" | "amount") => void;
};

export default function ModeToggle({ mode, onToggle }: ModeToggleProps) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={() => onToggle("percent")}
        className={cn(
          "cursor-pointer px-2.5 py-1.5 text-xs font-medium transition-colors",
          mode === "percent" ? "bg-primary/15 text-primary" : "bg-surface2 text-muted hover:bg-surface",
        )}
      >
        %
      </button>
      <button
        type="button"
        onClick={() => onToggle("amount")}
        className={cn(
          "cursor-pointer px-2.5 py-1.5 text-xs font-medium transition-colors",
          mode === "amount" ? "bg-primary/15 text-primary" : "bg-surface2 text-muted hover:bg-surface",
        )}
      >
        TL
      </button>
    </div>
  );
}
