import type { Record, RecordSearchReq } from "@/schemas/recordSchema";
import { Link, type useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Hash,
  Loader2,
  MoreHorizontal,
  Package,
  RotateCcw,
  Search,
  Smartphone,
  Trash,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { format, isValid, parse } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { formatDate } from "@/utils";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

type RecordFilterDisableFlags = {
  [K in keyof RecordSearchReq]?: boolean;
};

// We use string for values here because HTML inputs work with strings.
// The parent handles parsing before sending to API.
type RecordFiltersProps = {
  filters: { [K in keyof RecordSearchReq]: string };
  disabledFields?: RecordFilterDisableFlags;
  onChange: (key: keyof RecordSearchReq, value: string) => void;
  onReset: () => void;
};

type RecordPaginationProps = {
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

type RecordTableActions = {
  processingIds?: Set<number>;
  isRecordDisabled?: (r: Record) => boolean;
  onDelete?: (r: Record) => void;
  navigate: ReturnType<typeof useNavigate>;
};

type RecordDataGridProps = {
  data: Record[];
  isLoading: boolean;
  isPlaceholderData: boolean;
  filterProps: RecordFiltersProps;
  paginationProps: RecordPaginationProps;
} & Partial<RecordTableActions>;

const DATE_FORMAT = "dd-MM-yyyy";

// --- Main Component ---

export const RecordDataGrid = ({
  data,
  isLoading,
  isPlaceholderData,
  filterProps,
  paginationProps,
  processingIds,
  isRecordDisabled,
  onDelete,
  navigate,
}: RecordDataGridProps) => {
  return (
    <div
      className={cn(
        "space-y-4",
        isPlaceholderData && "opacity-70 transition-opacity",
      )}
    >
      <RecordFilters {...filterProps} />

      <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 shadow-2xl shadow-black/40 overflow-hidden">
        <RecordTable
          data={data}
          isLoading={isLoading}
          navigate={navigate!}
          processingIds={processingIds}
          isRecordDisabled={isRecordDisabled}
          onDelete={onDelete}
        />
        <RecordPaginationControls {...paginationProps} />
      </div>
    </div>
  );
};

function RecordFilters({
  filters,
  disabledFields,
  onChange,
  onReset,
}: RecordFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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

        {/* Vehicle No */}
        <FilterInput
          label="Vehicle No"
          icon={Truck}
          placeholder="e.g. GJ-05..."
          value={filters.vehicle_no}
          onChange={(e) => onChange("vehicle_no", e.target.value)}
          disabled={disabledFields?.vehicle_no}
        />

        {/* Mobile */}
        <FilterInput
          label="Driver Mobile"
          icon={Smartphone}
          placeholder="e.g. 98765..."
          value={filters.vehicle_mobile_no}
          onChange={(e) => onChange("vehicle_mobile_no", e.target.value)}
          disabled={disabledFields?.vehicle_mobile_no}
        />

        {/* Exact Date */}
        <FilterDatePicker
          label="Exact Date"
          value={filters.date}
          onChange={(val) => onChange("date", val)}
          disabled={disabledFields?.date}
        />

        {/* From Date */}
        <FilterDatePicker
          label="From Date"
          value={filters.from_date}
          onChange={(val) => onChange("from_date", val)}
          placeholder="Start date"
          disabled={disabledFields?.from_date}
        />

        {/* To Date */}
        <FilterDatePicker
          label="To Date"
          value={filters.to_date}
          onChange={(val) => onChange("to_date", val)}
          placeholder="End date"
          disabled={disabledFields?.to_date}
        />

        {/* Bill ID */}
        <FilterInput
          label="Bill ID"
          icon={Hash}
          placeholder="e.g. 1024"
          value={filters.bill_id}
          onChange={(e) => onChange("bill_id", e.target.value)}
          disabled={disabledFields?.bill_id}
          type="number"
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2 lg:col-span-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="text-zinc-500 hover:text-rose-500 cursor-pointer shrink-0"
            title="Clear filters"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function RecordPaginationControls({
  currentPage,
  totalPages,
  perPage,
  totalCount,
  onPageChange,
  onPerPageChange,
}: RecordPaginationProps) {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // Fix: Sync local input state if currentPage changes externally (e.g. deletion causing page drop)
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputCommit = () => {
    let p = parseInt(pageInput);
    if (isNaN(p)) {
      setPageInput(currentPage.toString());
      return;
    }
    // Clamp between 1 and totalPages
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
    <div className="border-t border-zinc-800 bg-zinc-900/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
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
        {/* Page Input */}
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

export type RecordTableProps = {
  data: Record[];
  isLoading: boolean;
} & RecordTableActions;

export function RecordTable({
  data,
  isLoading,
  processingIds = new Set(),
  onDelete,
  navigate,
}: RecordTableProps) {
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
        <RecordRow
          key={record.id}
          record={record}
          isProcessing={processingIds.has(record.id)}
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
            <TableHead className="hidden md:table-cell h-12 text-zinc-500 uppercase text-xs font-bold text-center">
              Bill Status
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

function RecordRow({
  record,
  isProcessing,
  onDelete,
  navigate,
}: {
  record: Record;
  isProcessing: boolean;
  onDelete?: (r: Record) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const isTypeIn = record.transaction_type === "IN";

  // check if record is billed
  const isBilled = !!record.bill_id;

  return (
    <TableRow
      className={`
        group border-zinc-800 transition-all duration-200 hover:bg-zinc-900/60 
        ${isProcessing ? "opacity-50 pointer-events-none bg-zinc-900/40" : ""}
      `}
      onDoubleClick={() => navigate({ to: `/records/${record.id}` })}
    >
      {/* ... (Previous cells remain exactly the same: ID, Date, Type, Vehicle, Items, Bill Status) ... */}

      <TableCell className="pl-6 font-mono text-xs text-left text-zinc-400 group-hover:text-zinc-200">
        #{record.id.toString().padStart(4, "0")}
      </TableCell>

      <TableCell>
        <div className="flex justify-center items-center gap-2 text-xs text-zinc-300">
          {formatDate(record.date)}
        </div>
      </TableCell>

      <TableCell className="text-center">
        <Badge
          variant="outline"
          className={`pl-2 pr-2.5 py-0.5 rounded-full border text-[10px] inline-flex items-center ${
            isTypeIn
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-orange-500/10 text-orange-400 border-orange-500/20"
          }`}
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
          <div className="flex flex-col items-start">
            {record.vehicle_no && (
              <span className="text-xs font-medium flex items-center gap-1 text-zinc-400">
                <Truck className="h-3 w-3" />
                {record.vehicle_no}
              </span>
            )}
            {record.vehicle_mobile_no && (
              <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-1 mt-0.5">
                <Smartphone className="h-2.5 w-2.5" />
                {record.vehicle_mobile_no}
              </span>
            )}
          </div>
        ) : (
          <span className="text-zinc-700 text-xs">-</span>
        )}
      </TableCell>

      <TableCell className="text-center">
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold flex items-center gap-1 text-zinc-200">
            {record.total.toLocaleString()}
            <Package className="h-3 w-3 text-zinc-500" />
          </span>
          {record.labour_charge > 0 && (
            <span className="text-[10px] text-zinc-500">
              + ₹{record.labour_charge} Labour
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="hidden md:table-cell text-center">
        {record.bill_id ? (
          <Link
            to={`/bills/$billId`}
            params={{ billId: record.bill_id.toString() }}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-medium hover:bg-blue-500/20 transition-colors"
          >
            <Hash className="h-3 w-3" />#{record.bill_id}
          </Link>
        ) : (
          <span className="text-[10px] text-zinc-700 font-medium uppercase tracking-wider">
            Unbilled
          </span>
        )}
      </TableCell>

      {/* --- Updated Actions Cell --- */}
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
              className="w-48 bg-zinc-950 border-zinc-800 text-zinc-400"
            >
              <DropdownMenuItem asChild>
                <Link
                  to="/records/$recordId"
                  params={{ recordId: record.id.toString() }}
                  className="cursor-pointer focus:bg-zinc-900 focus:text-zinc-200"
                >
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/records/update/$recordId"
                  params={{ recordId: record.id.toString() }}
                  className="cursor-pointer focus:bg-zinc-900 focus:text-zinc-200"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>

              {onDelete && (
                <>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem
                    disabled={isBilled} // Disable interaction
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isBilled) onDelete(record);
                    }}
                    // Conditionally style the button
                    className={cn(
                      "cursor-pointer",
                      isBilled
                        ? "text-zinc-600 opacity-50 cursor-not-allowed pointer-events-none"
                        : "text-rose-500 focus:bg-rose-950/20 focus:text-rose-400",
                    )}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    {isBilled ? "Billed (Locked)" : "Delete"}
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

interface FilterInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
}

function FilterInput({
  label,
  icon: Icon,
  className,
  ...props
}: FilterInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-zinc-500 font-medium ml-1">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
        )}
        <Input
          {...props}
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
  const dateValue =
    value && isValid(parse(value, DATE_FORMAT, new Date()))
      ? parse(value, DATE_FORMAT, new Date())
      : undefined;

  return (
    <div className="space-y-1.5">
      <label className="text-xs text-zinc-500 font-medium ml-1">{label}</label>
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
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
