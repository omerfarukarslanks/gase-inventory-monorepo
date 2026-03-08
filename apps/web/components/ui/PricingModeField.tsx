import ModeToggle from "@/components/ui/ModeToggle";
import { FieldError } from "@/components/ui/FieldError";

const DEFAULT_INPUT_CLASS =
  "h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary";

type PricingModeFieldProps = {
  label: string;
  mode: "percent" | "amount";
  value: string;
  onToggle: (mode: "percent" | "amount") => void;
  onValueChange: (value: string) => void;
  error?: string;
  inputType?: "text" | "number";
  placeholder?: string;
  inputClassName?: string;
};

export function PricingModeField({
  label,
  mode,
  value,
  onToggle,
  onValueChange,
  error,
  inputType = "text",
  placeholder,
  inputClassName = DEFAULT_INPUT_CLASS,
}: PricingModeFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted">{label}</label>
      <div className="flex items-center gap-2">
        <ModeToggle mode={mode} onToggle={onToggle} />
        <input
          type={inputType}
          {...(inputType === "number" ? { min: 0, step: "0.01" } : {})}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={inputClassName}
        />
      </div>
      <FieldError error={error} />
    </div>
  );
}
