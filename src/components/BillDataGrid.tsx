import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  CalendarRange,
  FileText,
  Hash,
  type LucideIcon,
  RotateCcw,
  Search,
} from "lucide-react";
import { useId } from "react";
import { themeStyles } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type { BillFiltersState } from "@/routes/bills";
import type { Bill } from "@/schemas/billSchema"; // Assuming you export the schema type here
import { formatCurrency } from "@/utils";
import { FilterDatePicker } from "./FilterDatePicker";
import {
  PaginationControls,
  type PaginationControlsProps,
} from "./PaginationControls";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

type BillFiltersProps = {
  filters: BillFiltersState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
};

type BillDataGridProps = {
  data: Bill[];
  isLoading: boolean;
  isPlaceholderData: boolean;
  filterProps: BillFiltersProps;
  paginationProps: PaginationControlsProps;
};

// --- Main Component ---

export function BillDataGrid({
  data,
  isLoading,
  isPlaceholderData,
  filterProps,
  paginationProps,
}: BillDataGridProps) {
  return (
    <div
      className={cn(
        "space-y-4",
        isPlaceholderData && "opacity-70 transition-opacity",
      )}
    >
      <BillFilters {...filterProps} />

      <div className="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">
        <PaginationControls
          {...paginationProps}
          className="border-b border-zinc-800"
        />
        <BillTable data={data} isLoading={isLoading} />
        <PaginationControls
          {...paginationProps}
          className="border-t border-zinc-800"
        />
      </div>
    </div>
  );
}

// --- Filters Component ---

function BillFilters({ filters, onChange, onReset }: BillFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className={themeStyles.glassHeader}>
      <div className={themeStyles.glassHeaderOverlay} />
      <div className="relative z-10 flex flex-col md:flex-row gap-4 items-stretch md:items-end">
        {/* Site ID */}
        <FilterInput
          label="Site ID"
          icon={Hash}
          placeholder="e.g. 55"
          value={filters.site_id}
          onChange={onChange}
          type="number"
          name="site_id"
        />

        {/* Khata No */}
        <FilterInput
          label="Khata No"
          icon={FileText}
          placeholder="e.g. 3 12"
          value={filters.khata_no}
          onChange={onChange}
          name="khata_no"
        />

        {/* Date */}
        <div className="flex-1 w-full">
          <FilterDatePicker
            label="To Date"
            value={filters.date}
            onChange={(val) =>
              onChange({
                target: { name: "date", value: val },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            placeholder="Date"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 justify-end shrink-0 h-10 pb-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="text-zinc-500 hover:text-rose-500 hover:bg-rose-950/10 cursor-pointer shrink-0 rounded-lg transition-all"
            title="Clear filters"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Table Component ---

export type BillTableProps = {
  data: Bill[];
  isLoading: boolean;
};

export function BillTable({ data, isLoading }: BillTableProps) {
  if (isLoading) {
    return (
      <TableWrapper>
        <SkeletonRows count={5} />
      </TableWrapper>
    );
  }

  if (data.length === 0) {
    return (
      <TableWrapper>
        <TableRow>
          <TableCell colSpan={6} className="h-96 text-center">
            <div className="flex flex-col items-center justify-center text-zinc-500 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-zinc-900/50 p-4 rounded-full mb-4 ring-1 ring-zinc-800">
                <Search className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg font-medium text-zinc-300">
                No Bills found
              </p>
              <p className="text-sm">
                Try adjusting your filters or search query.
              </p>
            </div>
          </TableCell>
        </TableRow>
      </TableWrapper>
    );
  }

  return (
    <TableWrapper>
      {data.map((bill) => (
        <BillRow key={bill.id} bill={bill} />
      ))}
    </TableWrapper>
  );
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader
          className={cn("sticky top-0 z-10", themeStyles.tableHeaderRow)}
        >
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="w-24 pl-6 h-12 text-zinc-500 uppercase text-xs font-bold text-left">
              Bill ID
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-center w-32">
              Site ID
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-left pl-6 min-w-[180px]">
              Billing Period
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-center w-32">
              Khata No
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-right pr-6 w-32">
              Total Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

// --- Row Component ---

function BillRow({ bill }: { bill: Bill }) {
  const navigate = useNavigate();
  return (
    <TableRow
      className={cn(themeStyles.tableRowInteractive)}
      onClick={() => {
        navigate({ to: `/bills/${bill.id}` });
      }}
    >
      {/* Bill ID */}
      <TableCell className="pl-6 py-4 font-mono text-xs text-left text-zinc-400 group-hover:text-zinc-200 font-medium">
        #{bill.id.toString()}
      </TableCell>

      {/* Site Link */}
      <TableCell className="text-center py-4">
        <Link
          to={`/sites/$siteId`}
          params={{ siteId: bill.site_id.toString() }}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-950 text-zinc-450 border border-zinc-850 text-[10px] font-semibold hover:border-zinc-700 hover:text-zinc-200 transition-colors shadow-sm"
        >
          <Hash className="h-3 w-3" />
          {bill.site_id}
        </Link>
      </TableCell>

      {/* Billing Period */}
      <TableCell className="pl-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <CalendarRange className="h-3 w-3 text-zinc-500" />
            <span>
              {format(new Date(bill.from_date), "dd MMM")} -{" "}
              {format(new Date(bill.to_date), "dd MMM yyyy")}
            </span>
          </div>
        </div>
      </TableCell>

      {/* Khata No */}
      <TableCell className="text-center py-4">
        {bill.khata_no ? (
          <span className="font-mono text-xs text-zinc-400">
            {bill.khata_no}
          </span>
        ) : (
          <span className="text-zinc-700 text-xs">-</span>
        )}
      </TableCell>

      {/* Total Amount */}
      <TableCell className="text-right pr-6 py-4">
        <span className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-0.5">
          {formatCurrency(bill.total || 0)}
        </span>
      </TableCell>
    </TableRow>
  );
}

// --- Utils (Reused from reference) ---

interface FilterInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
}

function FilterInput({
  label,
  icon: Icon,
  className,
  id,
  ...props
}: FilterInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="space-y-1.5 relative flex-1 w-full">
      <label
        htmlFor={inputId}
        className="text-xs text-zinc-500 font-medium ml-1"
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
        )}
        <Input
          {...props}
          id={inputId}
          className={cn(
            "pl-9 bg-zinc-950 border-zinc-800 focus:ring-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed",
            className,
          )}
        />
      </div>
    </div>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i} className="border-zinc-800 hover:bg-transparent">
          {/* Bill ID - Matches Font Mono width */}
          <TableCell className="pl-6">
            <Skeleton className="h-4 w-10 bg-zinc-800/60 rounded-sm" />
          </TableCell>

          {/* Customer ID - Matches the "Badge" look */}
          <TableCell className="flex justify-center">
            <div className="h-6 w-12 rounded-md bg-zinc-800/60" />
          </TableCell>

          {/* Billing Period - Matches the "Icon + Text" layout */}
          <TableCell className="pl-6">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                {/* Icon placeholder */}
                <Skeleton className="h-3 w-3 rounded-full bg-zinc-800" />
                {/* Date range text placeholder */}
                <Skeleton className="h-3 w-32 bg-zinc-800/60 rounded-sm" />
              </div>
            </div>
          </TableCell>

          {/* Khata No - Centered text */}
          <TableCell>
            <div className="flex justify-center">
              <Skeleton className="h-4 w-16 bg-zinc-800/40 rounded-sm" />
            </div>
          </TableCell>

          {/* Total Amount - Right aligned, slightly bolder height */}
          <TableCell className="pr-6">
            <div className="flex justify-end items-center gap-1">
              <Skeleton className="h-3 w-3 bg-zinc-800/40 rounded-full" />
              <Skeleton className="h-5 w-20 bg-zinc-800/60 rounded-sm" />
            </div>
          </TableCell>

          {/* Actions - Right aligned button */}
          <TableCell className="pr-6">
            <div className="flex justify-end">
              <Skeleton className="h-8 w-8 bg-zinc-800/40 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
