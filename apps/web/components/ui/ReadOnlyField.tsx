"use client";

import FormField from "./FormField";

type ReadOnlyFieldProps = {
  label?: string;
  value?: string | null;
  emptyLabel?: string;
  className?: string;
};

export default function ReadOnlyField({
  label,
  value,
  emptyLabel = "-",
  className,
}: ReadOnlyFieldProps) {
  return (
    <FormField label={label} className={className}>
      <div className="w-full rounded-xl2 border border-border bg-surface2 px-4 py-2.5 text-sm text-text2">
        {value?.trim() || emptyLabel}
      </div>
    </FormField>
  );
}
