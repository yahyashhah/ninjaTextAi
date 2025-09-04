// components/ui/safe-select.tsx
"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SafeSelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  placeholder: string;
  items: Array<{ value: string; label: string }>;
  className?: string;
}

export function SafeSelect({
  value,
  onValueChange,
  placeholder,
  items,
  className,
}: SafeSelectProps) {
  // Only include valid items
  const validItems = items.filter(
    (item) => item.value && item.value.trim() !== ""
  );

  return (
    <Select
      value={value === "" ? undefined : value}
      onValueChange={onValueChange}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {validItems.length === 0 ? (
          <SelectItem disabled value="__no_items__">
            No options available
          </SelectItem>
        ) : (
          validItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}