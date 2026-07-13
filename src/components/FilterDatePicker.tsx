import {
  format,
  isAfter,
  isBefore,
  isValid,
  parse,
  startOfDay,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import type React from "react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const DATE_FORMAT = "dd-MM-yyyy";

export interface FilterDatePickerProps {
  label?: React.ReactNode;
  value?: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function FilterDatePicker({
  label,
  value,
  min,
  max,
  onChange,
  placeholder,
  disabled = false,
}: FilterDatePickerProps) {
  const inputId = useId();
  const [open, setOpen] = useState(false);

  let dateValue: Date | undefined;
  if (value && isValid(parse(value, DATE_FORMAT, new Date()))) {
    dateValue = parse(value, DATE_FORMAT, new Date());
  }

  const minDate =
    min && isValid(parse(min, "yyyy-MM-dd", new Date()))
      ? parse(min, "yyyy-MM-dd", new Date())
      : undefined;
  const maxDate =
    max && isValid(parse(max, "yyyy-MM-dd", new Date()))
      ? parse(max, "yyyy-MM-dd", new Date())
      : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, DATE_FORMAT));
    } else {
      onChange("");
    }
    setOpen(false);
  };

  return (
    <div className={label ? "space-y-1.5 w-full" : "w-full"}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs text-zinc-500 font-medium ml-1"
        >
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={inputId}
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full h-10 pl-3 text-left font-normal bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-zinc-900 focus:ring-zinc-700 disabled:opacity-50 transition-colors",
              !dateValue && "text-zinc-500",
            )}
          >
            {dateValue
              ? format(dateValue, DATE_FORMAT)
              : placeholder || "Select date"}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-zinc-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-zinc-900 border-zinc-800 shadow-xl"
          align="start"
        >
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleSelect}
            disabled={(date) => {
              if (minDate && isBefore(startOfDay(date), startOfDay(minDate)))
                return true;
              if (maxDate && isAfter(startOfDay(date), startOfDay(maxDate)))
                return true;
              return false;
            }}
            autoFocus
            className="text-zinc-100 bg-zinc-950 border-zinc-800 rounded-md"
            formatters={{
              formatCaption: (date) => {
                const monthName = date.toLocaleString("en-US", {
                  month: "long",
                });
                const monthNumber = (date.getMonth() + 1)
                  .toString()
                  .padStart(2, "0");
                const year = date.getFullYear();
                return `${monthName}(${monthNumber}) ${year}`;
              },
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
