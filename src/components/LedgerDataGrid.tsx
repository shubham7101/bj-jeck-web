import type { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { format, isValid, parse } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Hash,
  IndianRupee,
  Loader2,
  type LucideIcon,
  MoreHorizontal,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Skeleton } from "./ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { formatCurrency } from "@/utils";

// --- Types ---

// Define the Ledger Entry shape based on your JSON
export type LedgerEntry = {
  id: number;
  customer_id: number;
  amount: number;
  date: string;
};

// Define the Search Request shape (Ensure your schema exports match this)
export type LedgerSearchReq = {
  customer_id?: string;
  date?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  per_page?: number;
};

const DATE_FORMAT = "dd-MM-yyyy";

type LedgerFilterDisableFlags = {
  [K in keyof LedgerSearchReq]?: boolean;
};

type LedgerFiltersProps = {
  filters: { [K in keyof LedgerSearchReq]: string };
  disabledFields?: LedgerFilterDisableFlags;
  onChange: (key: keyof LedgerSearchReq, value: string) => void;
  onReset: () => void;
};

type LedgerPaginationProps = {
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  className?: string;
};

type LedgerTableActions = {
  processingIds?: Set<number>;
  onDelete?: (r: LedgerEntry) => void;
  navigate: ReturnType<typeof useNavigate>;
};

type LedgerDataGridProps = {
  data: LedgerEntry[];
  isLoading: boolean;
  isPlaceholderData: boolean;
  filterProps: LedgerFiltersProps;
  paginationProps: LedgerPaginationProps;
} & Partial<LedgerTableActions>;

// --- Main Component ---

export function LedgerDataGrid({
  data,
  isLoading,
  isPlaceholderData,
  filterProps,
  paginationProps,
  processingIds,
  onDelete,
  navigate,
}: LedgerDataGridProps) {
  return (
    <div
      className={cn(
        "space-y-4",
        isPlaceholderData && "opacity-70 transition-opacity",
      )}
    >
      <LedgerFilters {...filterProps} />

      <div className="flex flex-col rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-500/50 to-transparent" />
        <LedgerPaginationControls {...paginationProps} className="border-b border-zinc-800" />
        <LedgerTable
          data={data}
          isLoading={isLoading}
          navigate={navigate!}
          processingIds={processingIds}
          onDelete={onDelete}
        />
        <LedgerPaginationControls {...paginationProps} className="border-t border-zinc-800" />
      </div>
    </div>
  );
}

// --- Filters Component ---

function LedgerFilters({
  filters,
  disabledFields,
  onChange,
  onReset,
}: LedgerFiltersProps) {
  // Check if any filter has a value
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 backdrop-blur-sm shadow-sm">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Customer ID Filter */}
        <FilterInput
          label="Customer ID"
          icon={Hash}
          placeholder="e.g. 55"
          value={filters.customer_id}
          onChange={(e) => onChange("customer_id", e.target.value)}
          disabled={disabledFields?.customer_id}
          type="number"
        />

        {/* Exact Date Filter */}
        <FilterDatePicker
          label="Exact Date"
          value={filters.date}
          onChange={(val) => onChange("date", val)}
          disabled={disabledFields?.date}
        />

        {/* From Date Filter */}
        <FilterDatePicker
          label="From Date"
          value={filters.from_date}
          onChange={(val) => onChange("from_date", val)}
          placeholder="Start date"
          disabled={disabledFields?.from_date}
        />

        {/* To Date Filter & Reset Button */}
        <div className="flex gap-2 items-end col-span-1 sm:col-span-2 lg:col-span-2 flex-1">
          <div className="flex-1">
            <FilterDatePicker
              label="To Date"
              value={filters.to_date}
              onChange={(val) => onChange("to_date", val)}
              placeholder="End date"
              disabled={disabledFields?.to_date}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="text-zinc-500 hover:text-rose-500 cursor-pointer shrink-0 mb-0.5"
            title="Clear filters"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Pagination Component ---

function LedgerPaginationControls({
  currentPage,
  totalPages,
  perPage,
  totalCount,
  onPageChange,
  onPerPageChange,
  className,
}: LedgerPaginationProps) {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputCommit = () => {
    let p = parseInt(pageInput, 10);
    if (Number.isNaN(p)) {
      setPageInput(currentPage.toString());
      return;
    }
    p = Math.max(1, Math.min(p, totalPages || 1));

    if (p !== currentPage) {
      onPageChange(p);
    } else {
      setPageInput(p.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handlePageInputCommit();
  };

  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endRecord = Math.min(currentPage * perPage, totalCount);

  return (
    <div className={cn("bg-zinc-900/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none", className)}>
      {/* Left Side: Rows Per Page & Info */}
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 border-zinc-800 bg-zinc-950 text-zinc-400 text-xs"
            >
              <span>
                Rows: <span className="text-zinc-200">{perPage}</span>
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="bg-zinc-950 border-zinc-800"
          >
            <DropdownMenuLabel className="text-zinc-500 text-xs">
              Rows per page
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={perPage.toString()}
              onValueChange={(val) => onPerPageChange(Number(val))}
            >
              {[5, 10, 20, 25, 50, 100].map((size) => (
                <DropdownMenuRadioItem
                  key={size}
                  value={size.toString()}
                  className="text-zinc-400 text-xs cursor-pointer focus:bg-zinc-900 focus:text-zinc-200"
                >
                  {size}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="text-xs text-zinc-500">
          <span className="hidden sm:inline">Showing </span>
          <span className="text-zinc-300 font-medium">
            {startRecord}-{endRecord}
          </span>
          <span> of </span>
          <span className="text-zinc-300 font-medium">{totalCount}</span>
        </div>
      </div>

      {/* Right Side: Navigation */}
      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Page</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={handlePageInputCommit}
            onKeyDown={handleKeyDown}
            className="h-8 w-12 text-center text-xs px-1 bg-zinc-950 border-zinc-800 focus:ring-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-zinc-500">of {totalPages}</span>
        </div>

        <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-8 w-8 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Table Component ---

export type LedgerTableProps = {
  data: LedgerEntry[];
  isLoading: boolean;
} & LedgerTableActions;

export function LedgerTable({
  data,
  isLoading,
  processingIds = new Set(),
  onDelete,
  navigate,
}: LedgerTableProps) {
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
          <TableCell colSpan={5} className="h-96 text-center">
            <div className="flex flex-col items-center justify-center text-zinc-500">
              <div className="bg-zinc-900/50 p-4 rounded-full mb-4">
                <Search className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg font-medium text-zinc-300">
                No Transactions Found
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
      {data.map((entry) => (
        <LedgerRow
          key={entry.id}
          entry={entry}
          isProcessing={processingIds.has(entry.id)}
          onDelete={onDelete}
          navigate={navigate}
        />
      ))}
    </TableWrapper>
  );
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader className="bg-zinc-900/50 sticky top-0 z-10">
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="w-24 pl-6 h-12 text-zinc-500 uppercase text-xs font-bold text-left">
              ID
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-center">
              Customer ID
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-center">
              Transaction Date
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-right pr-6">
              Amount
            </TableHead>
            <TableHead className="text-right pr-6 h-12 text-zinc-500 uppercase text-xs font-bold">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

function LedgerRow({
  entry,
  isProcessing,
  onDelete,
}: {
  entry: LedgerEntry;
  isProcessing: boolean;
  onDelete?: (r: LedgerEntry) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <TableRow
      className={`
        group border-zinc-800/60 transition-all duration-300 hover:bg-zinc-800/40 
        ${isProcessing ? "opacity-50 pointer-events-none bg-zinc-900/40" : ""}
      `}
    >
      {/* ID */}
      <TableCell className="pl-6 font-mono text-xs text-left text-zinc-400 group-hover:text-zinc-200">
        #{entry.id.toString().padStart(4, "0")}
      </TableCell>

      {/* Customer Link */}
      <TableCell className="text-center">
        <Link
          to={`/customers/$customerId`}
          params={{ customerId: entry.customer_id.toString() }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-950/50 text-zinc-400 border border-zinc-800/80 text-[11px] font-medium hover:bg-zinc-800 hover:text-white transition-colors shadow-sm"
        >
          <Hash className="h-3.5 w-3.5" />
          {entry.customer_id}
        </Link>
      </TableCell>

      {/* Date */}
      <TableCell>
        <div className="flex justify-center items-center gap-2 text-xs text-zinc-300">
          <CalendarIcon className="h-3.5 w-3.5 text-zinc-500" />
          {format(new Date(entry.date), "dd MMM yyyy")}
        </div>
      </TableCell>

      {/* Amount */}
      <TableCell className="text-right pr-6">
        <span className="text-base font-bold text-emerald-400 flex items-center justify-end gap-0.5 tabular-nums drop-shadow-[0_0_10px_rgba(52,211,153,0.15)] group-hover:drop-shadow-[0_0_12px_rgba(52,211,153,0.3)] transition-all">
          <IndianRupee className="h-3.5 w-3.5" />
          {formatCurrency(entry.amount)}
        </span>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right pr-6">
        {isProcessing ? (
          <div className="flex justify-end pr-2">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 text-zinc-600 hover:text-white"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-zinc-950 border-zinc-800 text-zinc-400"
            >
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(entry);
                  }}
                  className="cursor-pointer text-rose-500 focus:bg-rose-950/20 focus:text-rose-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Entry
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}

// --- Utils ---

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
    <div className="space-y-1.5 flex-1">
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

interface FilterDatePickerProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function FilterDatePicker({
  label,
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
}: FilterDatePickerProps) {
  const [open, setOpen] = useState(false);
  const buttonId = useId();
  const dateValue =
    value && isValid(parse(value, DATE_FORMAT, new Date()))
      ? parse(value, DATE_FORMAT, new Date())
      : undefined;

  return (
    <div className="space-y-1.5 flex-1">
      <label
        htmlFor={buttonId}
        className="text-xs text-zinc-500 font-medium ml-1"
      >
        {label}
      </label>
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={buttonId}
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full pl-3 text-left font-normal bg-zinc-950 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed",
              !dateValue && "text-muted-foreground",
            )}
          >
            {dateValue ? (
              format(dateValue, DATE_FORMAT)
            ) : (
              <span>{placeholder}</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-zinc-950 border-zinc-800"
          align="start"
        >
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              onChange(date ? format(date, DATE_FORMAT) : "");
              setOpen(false);
            }}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            initialFocus
            className="bg-zinc-950 text-zinc-200 rounded-md border-zinc-800"
          />
        </PopoverContent>
      </Popover>
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
            <Skeleton className="h-5 w-16 bg-zinc-800 rounded-md" />
          </TableCell>
          <TableCell className="flex justify-center">
            <Skeleton className="h-4 w-24 bg-zinc-800" />
          </TableCell>
          <TableCell className="flex justify-end pr-6">
            <Skeleton className="h-5 w-20 bg-zinc-800" />
          </TableCell>
          <TableCell className="pr-6 flex justify-end">
            <Skeleton className="h-8 w-8 bg-zinc-800" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
