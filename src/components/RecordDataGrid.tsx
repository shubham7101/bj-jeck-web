import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Hash,
  type LucideIcon,
  Package,
  RotateCcw,
  Search,
  Smartphone,
  Truck,
} from "lucide-react";
import { useId } from "react";
import { themeStyles } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type { Record, RecordSearchReq } from "@/schemas/recordSchema";
import { formatCurrency, formatDate } from "@/utils";
import { FilterDatePicker } from "./FilterDatePicker";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  PaginationControls,
  type PaginationControlsProps,
} from "./PaginationControls";
import { Skeleton } from "./ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

type RecordFiltersProps = {
  filters: { [K in keyof RecordSearchReq]: string };
  onChange: (key: keyof RecordSearchReq, value: string) => void;
  onReset: () => void;
};

type RecordDataGridProps = {
  data: Record[];
  isLoading: boolean;
  isPlaceholderData: boolean;
  filterProps: RecordFiltersProps;
  paginationProps: PaginationControlsProps;
};

export function RecordDataGrid({
  data,
  isLoading,
  isPlaceholderData,
  filterProps,
  paginationProps,
}: RecordDataGridProps) {
  return (
    <div
      className={cn(
        "space-y-4",
        isPlaceholderData && "opacity-70 transition-opacity",
      )}
    >
      <RecordFilters {...filterProps} />

      <div className="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">
        <PaginationControls
          {...paginationProps}
          className="border-b border-zinc-800/80"
        />
        <RecordTable data={data} isLoading={isLoading} />
        <PaginationControls
          {...paginationProps}
          className="border-t border-zinc-800"
        />
      </div>
    </div>
  );
}

function RecordFilters({ filters, onChange, onReset }: RecordFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className={themeStyles.glassHeader}>
      <div className={themeStyles.glassHeaderOverlay} />
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Customer ID */}
        <FilterInput
          label="Customer ID"
          icon={Hash}
          placeholder="e.g. 55"
          value={filters.customer_id}
          onChange={(e) => onChange("customer_id", e.target.value)}
          type="number"
        />

        {/* Vehicle No */}
        <FilterInput
          label="Vehicle No"
          icon={Truck}
          placeholder="e.g. GJ-05..."
          value={filters.vehicle_no}
          onChange={(e) => onChange("vehicle_no", e.target.value)}
        />

        {/* Mobile */}
        <FilterInput
          label="Driver Mobile"
          icon={Smartphone}
          placeholder="e.g. 98765..."
          value={filters.vehicle_mobile_no}
          onChange={(e) => onChange("vehicle_mobile_no", e.target.value)}
        />

        {/* Exact Date */}
        <FilterDatePicker
          label="Exact Date"
          value={filters.date}
          onChange={(val) => onChange("date", val)}
        />

        {/* From Date */}
        <FilterDatePicker
          label="From Date"
          value={filters.from_date}
          onChange={(val) => onChange("from_date", val)}
          placeholder="Start date"
        />

        {/* To Date */}
        <FilterDatePicker
          label="To Date"
          value={filters.to_date}
          onChange={(val) => onChange("to_date", val)}
          placeholder="End date"
        />

        {/* Bill ID */}
        <FilterInput
          label="Bill ID"
          icon={Hash}
          placeholder="e.g. 1024"
          value={filters.bill_id}
          onChange={(e) => onChange("bill_id", e.target.value)}
          type="number"
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-3 lg:col-span-1 justify-end">
          {hasActiveFilters && (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] uppercase font-bold tracking-wider py-0.5 px-2 animate-pulse"
            >
              Filters Active
            </Badge>
          )}
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

export type RecordTableProps = {
  data: Record[];
  isLoading: boolean;
};

export function RecordTable({ data, isLoading }: RecordTableProps) {
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
          <TableCell colSpan={7} className="h-96 text-center">
            <div className="flex flex-col items-center justify-center text-zinc-500">
              <div className="bg-zinc-900/50 p-4 rounded-full mb-4">
                <Search className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg font-medium text-zinc-300">
                No Records found
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
      {data.map((record) => (
        <RecordRow key={record.id} record={record} />
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
            <TableHead className="w-20 pl-6 h-12 text-zinc-500 uppercase text-xs font-bold text-left">
              ID
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-center">
              Date
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-center">
              Type
            </TableHead>
            <TableHead className="hidden md:table-cell h-12 text-zinc-500 uppercase text-xs font-bold text-left pl-4">
              Vehicle
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-center">
              Items
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-center">
              Bill Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

function RecordRow({ record }: { record: Record }) {
  const navigate = useNavigate();
  const isTypeIn = record.transaction_type === "IN";

  return (
    <TableRow
      className={cn(themeStyles.tableRowInteractive)}
      onClick={() => navigate({ to: `/records/${record.id}` })}
    >
      <TableCell className="pl-6 font-mono text-xs text-left text-zinc-400 group-hover:text-zinc-200">
        #{record.id.toString().padStart(4, "0")}
      </TableCell>

      <TableCell>
        <div className="flex justify-center items-center gap-2 text-xs text-zinc-300 group-hover:text-white transition-colors">
          {formatDate(record.date)}
        </div>
      </TableCell>

      <TableCell className="text-center">
        <Badge
          variant="outline"
          className={cn(
            isTypeIn ? themeStyles.badgeIn : themeStyles.badgeOut,
            "inline-flex items-center shadow-sm backdrop-blur-sm",
          )}
        >
          {isTypeIn ? (
            <ArrowDownLeft className="h-3 w-3 mr-1" />
          ) : (
            <ArrowUpRight className="h-3 w-3 mr-1" />
          )}
          {record.transaction_type}
        </Badge>
      </TableCell>

      <TableCell className="hidden md:table-cell pl-4">
        {record.vehicle_no || record.vehicle_mobile_no ? (
          <div className="flex flex-col items-start gap-1">
            {record.vehicle_no && (
              <span className="text-[10px] font-medium flex items-center gap-1.5 text-zinc-300 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-850 shadow-sm">
                <Truck className="h-3 w-3 text-blue-400" />
                {record.vehicle_no}
              </span>
            )}
            {record.vehicle_mobile_no && (
              <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 px-2">
                <Smartphone className="h-3 w-3 text-zinc-500" />
                {record.vehicle_mobile_no}
              </span>
            )}
          </div>
        ) : (
          <span className="text-zinc-650 text-[10px] font-medium italic pl-2 select-none">
            No Transport Info
          </span>
        )}
      </TableCell>

      <TableCell className="text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-semibold flex items-center gap-1.5 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-300 group-hover:text-zinc-100 group-hover:border-zinc-700 transition-all shadow-sm">
            {record.total || 0}
            <Package className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-400" />
          </span>
          <div className="flex flex-col gap-0.5">
            {record.labour_charge > 0 && (
              <span className="text-[9px] text-emerald-400 font-bold tracking-wide uppercase px-1 rounded bg-emerald-500/5">
                L: {formatCurrency(record.labour_charge || 0)}
              </span>
            )}
            {record.transport_charge > 0 && (
              <span className="text-[9px] text-purple-400 font-bold tracking-wide uppercase px-1 rounded bg-purple-500/5">
                T: {formatCurrency(record.transport_charge || 0)}
              </span>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="text-center">
        {record.bill_id ? (
          <Link
            to={`/bills/$billId`}
            params={{ billId: record.bill_id.toString() }}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-950 text-zinc-450 border border-zinc-800 text-[10px] font-semibold hover:border-zinc-700 hover:text-zinc-200 transition-colors shadow-sm"
          >
            <Hash className="h-3 w-3" />#{record.bill_id}
          </Link>
        ) : (
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-950/60 px-2 py-0.5 rounded border border-zinc-800 border-dashed">
            Unbilled
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

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
    <div className="space-y-1.5">
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
        <TableRow key={i} className="border-zinc-800">
          <TableCell className="pl-6">
            <Skeleton className="h-4 w-12 bg-zinc-800" />
          </TableCell>
          <TableCell className="flex justify-center">
            <Skeleton className="h-4 w-24 bg-zinc-800" />
          </TableCell>
          <TableCell>
            <div className="flex justify-center">
              <Skeleton className="h-5 w-16 rounded-full bg-zinc-800" />
            </div>
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <div className="space-y-1">
              <Skeleton className="h-3 w-20 bg-zinc-800" />
              <Skeleton className="h-3 w-16 bg-zinc-800" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="h-4 w-8 bg-zinc-800" />
              <Skeleton className="h-3 w-12 bg-zinc-800" />
            </div>
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <div className="flex justify-center">
              <Skeleton className="h-5 w-16 bg-zinc-800" />
            </div>
          </TableCell>
          <TableCell className="pr-6 flex justify-end">
            <Skeleton className="h-8 w-8 bg-zinc-800" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
