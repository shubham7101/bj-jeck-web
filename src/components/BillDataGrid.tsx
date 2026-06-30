import { Link, type useNavigate } from "@tanstack/react-router";
import { format, isValid, parse } from "date-fns";
import {
  CalendarIcon,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Hash,
  Loader2,
  type LucideIcon,
  MoreHorizontal,
  RotateCcw,
  Search,
  Trash,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { themeStyles } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type { Bill, BillSearchReq } from "@/schemas/billSchema"; // Assuming you export the schema type here
import { formatCurrency } from "@/utils";
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
  DropdownMenuSeparator,
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

type BillFilterDisableFlags = {
  [K in keyof BillSearchReq]?: boolean;
};

type BillFiltersProps = {
  filters: { [K in keyof BillSearchReq]: string };
  disabledFields?: BillFilterDisableFlags;
  onChange: (key: keyof BillSearchReq, value: string) => void;
  onReset: () => void;
};

type BillPaginationProps = {
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  className?: string;
};

type BillTableActions = {
  processingIds?: Set<number>;
  onDelete?: (b: Bill) => void;
  navigate: ReturnType<typeof useNavigate>;
};

type BillDataGridProps = {
  data: Bill[];
  isLoading: boolean;
  isPlaceholderData: boolean;
  filterProps: BillFiltersProps;
  paginationProps: BillPaginationProps;
} & Partial<BillTableActions>;

const DATE_FORMAT = "dd-MM-yyyy";

// --- Main Component ---

export function BillDataGrid({
  data,
  isLoading,
  isPlaceholderData,
  filterProps,
  paginationProps,
  processingIds,
  onDelete,
  navigate,
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
        <BillPaginationControls
          {...paginationProps}
          className="border-b border-zinc-800"
        />
        <BillTable
          data={data}
          isLoading={isLoading}
          navigate={navigate!}
          processingIds={processingIds}
          onDelete={onDelete}
        />
        <BillPaginationControls
          {...paginationProps}
          className="border-t border-zinc-800"
        />
      </div>
    </div>
  );
}

// --- Filters Component ---

function BillFilters({
  filters,
  disabledFields,
  onChange,
  onReset,
}: BillFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className={themeStyles.glassHeader}>
      <div className={themeStyles.glassHeaderOverlay} />
      <div className="relative z-10 flex flex-col md:flex-row gap-4 items-end">
        {/* Customer ID */}
        <FilterInput
          label="Customer ID"
          icon={Hash}
          placeholder="e.g. 55"
          value={filters.customer_id}
          onChange={(e) => onChange("customer_id", e.target.value)}
          disabled={disabledFields?.customer_id}
          type="number"
        />

        {/* Khata No */}
        <FilterInput
          label="Khata No"
          icon={FileText}
          placeholder="e.g. 3 12"
          value={filters.khata_no}
          onChange={(e) => onChange("khata_no", e.target.value)}
          disabled={disabledFields?.khata_no}
        />

        {/* Date */}
        <div className="flex-1 w-full">
          <FilterDatePicker
            label="To Date"
            value={filters.date}
            onChange={(val) => onChange("date", val)}
            placeholder="Date"
            disabled={disabledFields?.date}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 justify-end shrink-0 h-10 pb-0.5">
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

// --- Pagination Component ---

function BillPaginationControls({
  currentPage,
  totalPages,
  perPage,
  totalCount,
  onPageChange,
  onPerPageChange,
  className,
}: BillPaginationProps) {
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

export type BillTableProps = {
  data: Bill[];
  isLoading: boolean;
} & BillTableActions;

export function BillTable({
  data,
  isLoading,
  processingIds = new Set(),
  onDelete,
  navigate,
}: BillTableProps) {
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
        <BillRow
          key={bill.id}
          bill={bill}
          isProcessing={processingIds.has(bill.id)}
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
        <TableHeader
          className={cn("sticky top-0 z-10", themeStyles.tableHeaderRow)}
        >
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="w-24 pl-6 h-12 text-zinc-500 uppercase text-xs font-bold text-left">
              Bill ID
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold text-center w-32">
              Customer ID
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
            <TableHead className="text-right pr-6 h-12 text-zinc-500 uppercase text-xs font-bold w-16">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

// --- Row Component ---

function BillRow({
  bill,
  isProcessing,
  onDelete,
  navigate,
}: {
  bill: Bill;
  isProcessing: boolean;
  onDelete?: (b: Bill) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <TableRow
      className={cn(
        themeStyles.tableRowInteractive,
        isProcessing && "opacity-50 pointer-events-none bg-zinc-900/40",
      )}
      onDoubleClick={() => navigate({ to: `/bills/${bill.id}` })}
    >
      {/* Bill ID */}
      <TableCell className="pl-6 font-mono text-xs text-left text-zinc-400 group-hover:text-zinc-200 font-medium">
        #{bill.id.toString()}
      </TableCell>

      {/* Customer Link */}
      <TableCell className="text-center">
        <Link
          to={`/customers/$customerId`}
          params={{ customerId: bill.customer_id.toString() }}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-950 text-zinc-450 border border-zinc-850 text-[10px] font-semibold hover:border-zinc-700 hover:text-zinc-200 transition-colors shadow-sm"
        >
          <Hash className="h-3 w-3" />
          {bill.customer_id}
        </Link>
      </TableCell>

      {/* Billing Period */}
      <TableCell className="pl-6">
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
      <TableCell className="text-center">
        {bill.khata_no ? (
          <span className="font-mono text-xs text-zinc-400">
            {bill.khata_no}
          </span>
        ) : (
          <span className="text-zinc-700 text-xs">-</span>
        )}
      </TableCell>

      {/* Total Amount */}
      <TableCell className="text-right pr-6">
        <span className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-0.5">
          {formatCurrency(bill.total || 0)}
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
              className="w-48 bg-zinc-950 border-zinc-800 text-zinc-400"
            >
              <DropdownMenuItem asChild>
                <Link
                  to="/bills/$billId"
                  params={{ billId: bill.id.toString() }}
                  className="cursor-pointer focus:bg-zinc-900 focus:text-zinc-200"
                >
                  <Eye className="mr-2 h-4 w-4" /> View Invoice
                </Link>
              </DropdownMenuItem>

              {onDelete && (
                <>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(bill);
                    }}
                    className="cursor-pointer text-rose-500 focus:bg-rose-950/20 focus:text-rose-400"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
    <div className="space-y-1.5 relative flex-1">
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
    <div className="space-y-1.5">
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
