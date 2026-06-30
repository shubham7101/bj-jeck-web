import { Link, type useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Loader2,
  MapPin,
  MoreHorizontal,
  Phone,
  Power,
  RotateCcw,
  Search,
  Trash,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { themeStyles } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type {
  Customer,
  customerSearchReqSchema,
} from "@/schemas/customerSchema";
import { formatDate } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
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

type CustomerFiltersState = Pick<
  z.infer<typeof customerSearchReqSchema>,
  "name" | "address" | "mobile_no"
>;

type CustomerFilterDisableFlags = {
  [K in keyof CustomerFiltersState]?: boolean;
};

type CustomerFiltersProps = {
  filters: CustomerFiltersState;
  disabledFields?: CustomerFilterDisableFlags;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
};

type CustomerPaginationProps = {
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  className?: string;
};

type CustomerTableActions = {
  processingIds?: Set<number>;
  onSelect?: (c: Customer) => void;
  onDelete?: (c: Customer) => void;
  onToggleStatus?: (c: Customer) => void;
  navigate: ReturnType<typeof useNavigate>;
};

type CustomerDataGridProps = {
  data: Customer[];
  isLoading: boolean;
  isPlaceholderData: boolean;
  filterProps: CustomerFiltersProps;
  paginationProps?: CustomerPaginationProps;
} & Partial<CustomerTableActions>;

export function CustomerDataGrid({
  data,
  isLoading,
  isPlaceholderData,
  filterProps,
  paginationProps,
  processingIds,
  ...actions
}: CustomerDataGridProps) {
  return (
    <div
      className={cn(
        "space-y-4",
        isPlaceholderData && "opacity-70 transition-opacity",
      )}
    >
      <CustomerFilters {...filterProps} />

      <div className="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">
        {paginationProps && (
          <CustomerPaginationControls
            {...paginationProps}
            className="border-b border-zinc-800/80"
          />
        )}
        <CustomerTable
          data={data}
          isLoading={isLoading}
          navigate={actions.navigate!}
          processingIds={processingIds}
          {...actions}
        />
        {paginationProps && (
          <CustomerPaginationControls
            {...paginationProps}
            className="border-t border-zinc-800/80"
          />
        )}
      </div>
    </div>
  );
}

function CustomerFilters({
  filters,
  disabledFields,
  onChange,
  onReset,
}: CustomerFiltersProps) {
  const hasActiveFilters = !!(
    filters.name ||
    filters.mobile_no ||
    filters.address
  );

  return (
    <div className={themeStyles.glassHeader}>
      <div className={themeStyles.glassHeaderOverlay} />
      <div className="relative z-10 flex flex-col md:flex-row gap-3 items-end">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
          <Input
            name="name"
            placeholder="Search by name..."
            value={filters.name}
            onChange={onChange}
            disabled={disabledFields?.name}
            className="pl-10 h-11 bg-zinc-950/50 border-zinc-800/50 hover:bg-zinc-900/50 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 rounded-xl transition-all"
          />
        </div>
        <div className="relative w-full flex-1 group">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
          <Input
            name="mobile_no"
            placeholder="Search mobile..."
            value={filters.mobile_no}
            onChange={onChange}
            disabled={disabledFields?.mobile_no}
            className="pl-10 h-11 bg-zinc-950/50 border-zinc-800/50 hover:bg-zinc-900/50 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 rounded-xl transition-all font-mono"
          />
        </div>
        <div className="relative w-full flex-1 group">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
          <Input
            name="address"
            placeholder="Search address..."
            value={filters.address}
            onChange={onChange}
            disabled={disabledFields?.address}
            className="pl-10 h-11 bg-zinc-950/50 border-zinc-800/50 hover:bg-zinc-900/50 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 rounded-xl transition-all"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0 h-11">
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
            className="h-11 w-11 rounded-xl text-zinc-500 hover:text-rose-500 hover:bg-rose-950/10 cursor-pointer shrink-0 border border-transparent transition-all"
            title="Clear filters"
          >
            <RotateCcw
              className={cn("h-4 w-4", hasActiveFilters && "animate-spin-once")}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CustomerPaginationControls({
  currentPage,
  totalPages,
  perPage,
  totalCount,
  onPageChange,
  onPerPageChange,
  className,
}: CustomerPaginationProps) {
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
              className="h-8 gap-2 border-zinc-700 bg-zinc-950/50 text-zinc-400 text-xs hover:bg-zinc-900 focus:ring-1 focus:ring-emerald-500/50 transition-all rounded-lg"
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

        <div className="text-xs text-zinc-500 flex items-center gap-1 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800/50">
          <span className="hidden sm:inline">Showing</span>
          <span className="text-zinc-200 font-medium">
            {startRecord}-{endRecord}
          </span>
          <span>of</span>
          <span className="text-zinc-200 font-medium">{totalCount}</span>
        </div>
      </div>

      {/* Right Side: Navigation */}
      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
        {/* Page Input */}
        <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-lg">
          <span className="text-xs text-zinc-500 pl-2">Page</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={handlePageInputCommit}
            onKeyDown={handleKeyDown}
            className="h-7 w-12 text-center text-xs px-1 bg-zinc-950 border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-emerald-500/50 rounded transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-zinc-500 pr-2">of {totalPages}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-7 w-7 border-transparent bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-805 rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-zinc-800 mx-1" />
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-7 w-7 border-transparent bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-805 rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

type CustomerTableProps = {
  data: Customer[];
  isLoading: boolean;
} & CustomerTableActions;

function CustomerTable({
  data,
  isLoading,
  processingIds = new Set(),
  onSelect,
  onDelete,
  onToggleStatus,
  navigate,
}: CustomerTableProps) {
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
                No customers found
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
    <TableWrapper onSelect={!!onSelect}>
      {data.map((customer) => (
        <CustomerRow
          key={customer.id}
          customer={customer}
          isProcessing={processingIds.has(customer.id)}
          onSelect={onSelect}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
          navigate={navigate}
        />
      ))}
    </TableWrapper>
  );
}

function TableWrapper({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect?: boolean;
}) {
  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader
          className={cn("sticky top-0 z-10", themeStyles.tableHeaderRow)}
        >
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="w-20 pl-6 h-12 text-zinc-500 uppercase text-xs font-bold">
              ID
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold">
              Customer
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold">
              Mobile
            </TableHead>
            <TableHead className="hidden md:table-cell h-12 text-zinc-500 uppercase text-xs font-bold">
              Location
            </TableHead>
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold">
              Status
            </TableHead>
            <TableHead className="text-right pr-6 h-12 text-zinc-500 uppercase text-xs font-bold">
              {onSelect ? "Select" : "Actions"}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

function CustomerRow({
  customer,
  isProcessing,
  onSelect,
  onDelete,
  onToggleStatus,
  navigate,
}: {
  customer: Customer;
  isProcessing: boolean;
  navigate?: ReturnType<typeof useNavigate>;
} & Omit<CustomerTableActions, "navigate" | "processingIds">) {
  const handleRowClick = () => {
    if (onSelect) {
      onSelect(customer);
    }
  };

  const handleDoubleClick = () => {
    if (onSelect) {
      onSelect(customer);
    } else if (navigate) {
      navigate({ to: `/customers/${customer.id}` });
    }
  };

  return (
    <TableRow
      onClick={handleRowClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        themeStyles.tableRowInteractive,
        onSelect && "cursor-pointer",
        isProcessing && "opacity-50 pointer-events-none bg-zinc-900/40",
      )}
    >
      <TableCell className="pl-6 font-mono text-xs text-zinc-600 group-hover:text-emerald-500/70 transition-colors">
        #{customer.id.toString().padStart(4, "0")}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border border-zinc-700/50 shadow-sm group-hover:border-emerald-500/50 transition-colors">
            <AvatarImage
              src={customer.avatar || undefined}
              alt={customer.name}
            />
            <AvatarFallback className="bg-zinc-800 text-xs text-zinc-300 font-medium">
              {customer.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="font-semibold text-zinc-200 text-sm block group-hover:text-emerald-50 transition-colors">
              {customer.name}
            </span>
            <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
              Joined {formatDate(customer.joined_date)}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono group-hover:text-zinc-300 transition-colors">
          <Phone className="h-3.5 w-3.5 opacity-70" />
          {customer.mobile_no}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2 text-zinc-500 max-w-45 group-hover:text-zinc-400 transition-colors">
          <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="truncate text-sm">{customer.address}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            customer.active
              ? themeStyles.activeBadge
              : themeStyles.inactiveBadge,
            "group-hover:bg-transparent",
          )}
        >
          <span
            className={cn(
              "mr-1.5 h-1.5 w-1.5 rounded-full print:hidden",
              customer.active ? "bg-emerald-500 animate-pulse" : "bg-zinc-500",
            )}
          />
          {customer.active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right pr-6">
        {isProcessing ? (
          <div className="flex justify-end pr-2">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          </div>
        ) : onSelect ? (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(customer);
            }}
            className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500"
          >
            <Check className="h-3 w-3 mr-1" /> Select
          </Button>
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
                  to="/customers/$customerId"
                  params={{ customerId: customer.id.toString() }}
                  className="cursor-pointer focus:bg-zinc-900 focus:text-zinc-200"
                >
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/customers/update/$customerId"
                  params={{ customerId: customer.id.toString() }}
                  className="cursor-pointer focus:bg-zinc-900 focus:text-zinc-200"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              {onToggleStatus && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(customer);
                  }}
                  className="cursor-pointer focus:bg-zinc-900 focus:text-zinc-200"
                >
                  {customer.active ? (
                    <>
                      <Power className="mr-2 h-4 w-4 text-orange-500" /> Mark
                      Inactive
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4 text-emerald-500" /> Mark
                      Active
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(customer);
                  }}
                  className="text-rose-500 cursor-pointer focus:bg-rose-950/20 focus:text-rose-400"
                >
                  <Trash className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i} className="border-zinc-800">
          <TableCell className="pl-6">
            <Skeleton className="h-4 w-8 bg-zinc-800" />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-9 rounded-full bg-zinc-800" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-zinc-800" />
                <Skeleton className="h-3 w-16 bg-zinc-800" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 bg-zinc-800" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32 bg-zinc-800" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full bg-zinc-800" />
          </TableCell>
          <TableCell className="pr-6 flex justify-end">
            <Skeleton className="h-8 w-8 bg-zinc-800" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
