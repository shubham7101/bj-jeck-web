import type { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { format, isValid, parse } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Hash,
  IndianRupee,
  Loader2,
  type LucideIcon,
  MoreHorizontal,
  RotateCcw,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { themeStyles } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type { Customer } from "@/schemas/customerSchema";
import { formatCurrency, getInitials } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
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

// --- Types ---

// Define the Ledger Entry shape based on your JSON
export type LedgerEntry = {
  id: number;
  customer_id: number;
  amount: number;
  date: string;
  notes?: string;
  type: "payment" | "discount" | "refund";
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
  customerMap?: Map<number, Customer>;
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
  customerMap,
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
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-zinc-500/50 to-transparent" />
        <LedgerPaginationControls
          {...paginationProps}
          className="border-b border-zinc-800"
        />
        <LedgerTable
          data={data}
          isLoading={isLoading}
          navigate={navigate!}
          processingIds={processingIds}
          onDelete={onDelete}
          customerMap={customerMap}
        />
        <LedgerPaginationControls
          {...paginationProps}
          className="border-t border-zinc-800"
        />
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
    <div className={themeStyles.glassHeader}>
      <div className={themeStyles.glassHeaderOverlay} />
      <div className="relative z-10 flex flex-col md:flex-row gap-4 items-end">
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
        <div className="flex gap-3 items-end flex-1 w-full">
          <div className="flex-1">
            <FilterDatePicker
              label="To Date"
              value={filters.to_date}
              onChange={(val) => onChange("to_date", val)}
              placeholder="End date"
              disabled={disabledFields?.to_date}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0 h-10 pb-0.5">
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
    <div
      className={cn(
        "bg-zinc-900/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none",
        className,
      )}
    >
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
            className="h-8 w-12 text-center text-xs px-1 bg-zinc-950 border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
            className="h-8 w-8 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-700 disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-700 disabled:opacity-30 transition-all"
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
  customerMap?: Map<number, Customer>;
} & LedgerTableActions;

export function LedgerTable({
  data,
  isLoading,
  processingIds = new Set(),
  onDelete,
  navigate,
  customerMap,
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
          <TableCell colSpan={6} className="h-96 text-center">
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
          customer={customerMap?.get(entry.customer_id)}
        />
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
              ID
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-left pl-4">
              Customer
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-center">
              Transaction Date
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-center">
              Type
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-left pl-4">
              Notes / Remarks
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-right pr-6">
              Amount
            </TableHead>
            <TableHead className="text-right pr-6 h-12 text-zinc-500 uppercase text-xs font-bold w-20">
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
  customer,
}: {
  entry: LedgerEntry;
  isProcessing: boolean;
  onDelete?: (r: LedgerEntry) => void;
  navigate: ReturnType<typeof useNavigate>;
  customer?: Customer;
}) {
  return (
    <TableRow
      className={cn(
        themeStyles.tableRowInteractive,
        isProcessing && "opacity-50 pointer-events-none bg-zinc-900/40",
      )}
    >
      {/* ID */}
      <TableCell className="pl-6 font-mono text-xs text-left text-zinc-400 group-hover:text-zinc-200">
        #{entry.id.toString().padStart(4, "0")}
      </TableCell>

      {/* Customer Link */}
      <TableCell className="text-left pl-4">
        <Link
          to={`/customers/$customerId`}
          params={{ customerId: entry.customer_id.toString() }}
          className="flex items-center gap-3 group/cust hover:opacity-90 transition-opacity"
        >
          <Avatar className="h-8 w-8 border border-zinc-800 shrink-0">
            <AvatarImage
              src={customer?.avatar || undefined}
              alt={customer?.name}
            />
            <AvatarFallback className="bg-zinc-850 text-[10px] text-zinc-450 font-bold">
              {customer ? (
                getInitials(customer.name)
              ) : (
                <User className="h-3.5 w-3.5 text-zinc-500" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-zinc-200 group-hover/cust:text-emerald-400 truncate max-w-[180px] transition-colors">
              {customer ? customer.name : `Customer #${entry.customer_id}`}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              ID: #{entry.customer_id}{" "}
              {customer?.mobile_no ? `• ${customer.mobile_no}` : ""}
            </span>
          </div>
        </Link>
      </TableCell>

      {/* Date */}
      <TableCell>
        <div className="flex justify-center items-center gap-2 text-xs text-zinc-300">
          <CalendarIcon className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          {format(new Date(entry.date), "dd MMM yyyy")}
        </div>
      </TableCell>

      {/* Type */}
      <TableCell className="text-center">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] uppercase font-bold tracking-wider py-0.5 px-2",
            entry.type === "payment" &&
              "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            entry.type === "discount" &&
              "bg-amber-500/10 text-amber-400 border-amber-500/20",
            entry.type === "refund" &&
              "bg-rose-500/10 text-rose-400 border-rose-500/20",
          )}
        >
          {entry.type}
        </Badge>
      </TableCell>

      {/* Notes / Remarks */}
      <TableCell className="text-left pl-4">
        {entry.notes ? (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 max-w-[280px]">
            <FileText className="h-3.5 w-3.5 text-zinc-550 shrink-0" />
            <span className="truncate" title={entry.notes}>
              {entry.notes}
            </span>
          </div>
        ) : (
          <span className="text-zinc-600 text-xs">-</span>
        )}
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
                className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700 border border-transparent rounded-lg transition-all"
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
          <TableCell className="pl-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full bg-zinc-800 shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32 bg-zinc-800" />
                <Skeleton className="h-3 w-20 bg-zinc-800/60" />
              </div>
            </div>
          </TableCell>
          <TableCell className="flex justify-center h-12 items-center">
            <Skeleton className="h-4 w-24 bg-zinc-800" />
          </TableCell>
          <TableCell className="pl-4">
            <Skeleton className="h-4 w-40 bg-zinc-800/50" />
          </TableCell>
          <TableCell className="text-right pr-6">
            <Skeleton className="h-5 w-20 bg-zinc-800 ml-auto" />
          </TableCell>
          <TableCell className="pr-6 text-right">
            <Skeleton className="h-8 w-8 bg-zinc-800 ml-auto rounded-lg" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
