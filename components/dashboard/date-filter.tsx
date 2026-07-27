"use client";

import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DATE_FILTER_OPTIONS } from "@/lib/admin/date-ranges";
import type { DateFilterPreset } from "@/lib/types";

interface DateFilterProps {
  value: DateFilterPreset;
  customFrom?: string;
  customTo?: string;
  onChange: (preset: DateFilterPreset, custom?: { from?: string; to?: string }) => void;
}

export function DateFilter({ value, customFrom, customTo, onChange }: DateFilterProps) {
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({
    from: customFrom ? new Date(customFrom) : undefined,
    to: customTo ? new Date(customTo) : undefined,
  });
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value}
        onValueChange={(val) => {
          if (val === "custom") {
            setOpen(true);
            onChange("custom", {
              from: range.from?.toISOString(),
              to: range.to?.toISOString(),
            });
          } else {
            onChange(val as DateFilterPreset);
          }
        }}
      >
        <SelectTrigger className="w-full sm:w-44 gap-2 bg-transparent">
          <CalendarIcon className="w-4 h-4" />
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          {DATE_FILTER_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === "custom" && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              {range.from && range.to
                ? `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`
                : "Pick dates"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={range as any}
              onSelect={(r: any) => {
                setRange(r || {});
                if (r?.from && r?.to) {
                  onChange("custom", { from: r.from.toISOString(), to: r.to.toISOString() });
                  setOpen(false);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
