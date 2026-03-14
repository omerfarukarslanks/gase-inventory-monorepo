"use client";

import SearchableMultiSelectDropdown from "@/components/ui/SearchableMultiSelectDropdown";
import { ReportField } from "@/components/reports/ReportField";

type ReportStoreFieldProps = {
  options: Array<{ value: string; label: string }>;
  values: string[];
  onChange: (values: string[]) => void;
};

export function ReportStoreField({ options, values, onChange }: ReportStoreFieldProps) {
  return (
    <ReportField label="Magazalar" className="min-w-[220px] flex-1">
      <SearchableMultiSelectDropdown
        options={options}
        values={values}
        onChange={onChange}
        placeholder="Magaza secin"
      />
    </ReportField>
  );
}
