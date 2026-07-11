import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, Phone, RotateCcw, Search } from "lucide-react";
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

// --- Types ---

type CustomerFiltersState = Pick<
  z.infer<typeof customerSearchReqSchema>,
  "name" | "mobile_no"
>;

type CustomerFiltersProps = {
  filters: CustomerFiltersState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
};

// CustomerPaginationProps has been extracted to PaginationControlsProps

type CustomerDataGridProps = {
  data: Customer[];
  isLoading: boolean;
  isPlaceholderData: boolean;
  filterProps: CustomerFiltersProps;
  paginationProps?: PaginationControlsProps;
  onSelect?: (customer: Customer) => void;
};

export function CustomerDataGrid({
  data,
  isLoading,
  isPlaceholderData,
  filterProps,
  paginationProps,
  onSelect,
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
          <PaginationControls
            {...paginationProps}
            className="border-b border-zinc-800/80"
          />
        )}
        <CustomerTable data={data} isLoading={isLoading} onSelect={onSelect} />
        {paginationProps && (
          <PaginationControls
            {...paginationProps}
            className="border-t border-zinc-800/80"
          />
        )}
      </div>
    </div>
  );
}

function CustomerFilters({ filters, onChange, onReset }: CustomerFiltersProps) {
  const hasActiveFilters = !!(filters.name || filters.mobile_no);

  return (
    <div className={themeStyles.glassHeader}>
      <div className={themeStyles.glassHeaderOverlay} />
      <div className="relative z-10 flex flex-col md:flex-row gap-3 items-stretch md:items-end">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
          <Input
            name="name"
            placeholder="Search by name..."
            value={filters.name}
            onChange={onChange}
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
            className="pl-10 h-11 bg-zinc-950/50 border-zinc-800/50 hover:bg-zinc-900/50 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 rounded-xl transition-all font-mono"
          />
        </div>
        <div className="flex items-center justify-end gap-3 shrink-0 h-11 w-full md:w-auto">
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

// --- Table Component ---
type CustomerTableProps = {
  data: Customer[];
  isLoading: boolean;
  onSelect?: (customer: Customer) => void;
};

function CustomerTable({ data, isLoading, onSelect }: CustomerTableProps) {
  if (isLoading) {
    return (
      <TableWrapper onSelect={!!onSelect}>
        <SkeletonRows count={5} />
      </TableWrapper>
    );
  }

  if (data.length === 0) {
    return (
      <TableWrapper onSelect={!!onSelect}>
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
          onSelect={onSelect}
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
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[700px]">
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
            <TableHead className="h-12 text-zinc-500 uppercase text-xs font-bold">
              Status
            </TableHead>
            <TableHead className="text-right pr-6 h-12 text-zinc-500 uppercase text-xs font-bold">
              {onSelect ? "Select" : ""}
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
  onSelect,
}: {
  customer: Customer;
  onSelect?: (customer: Customer) => void;
}) {
  const navigate = useNavigate();

  return (
    <TableRow
      onClick={() => {
        if (onSelect) {
          onSelect(customer);
        } else {
          navigate({ to: `/customers/${customer.id}` });
        }
      }}
      className={cn(themeStyles.tableRowInteractive, "cursor-pointer")}
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
        <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-emerald-500 transition-colors ml-auto" />
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
