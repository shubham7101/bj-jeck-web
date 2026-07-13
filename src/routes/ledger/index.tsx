import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import z from "zod";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LedgerDataGrid } from "@/components/LedgerDataGrid";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { Route as rootRoute } from "@/routes/__root";
import { customerService } from "@/services/customerService";
import { ledgerService } from "@/services/ledgerService";
import { siteService } from "@/services/siteService";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ledger/",
  component: LedgerPage,
  validateSearch: (search) => ledgerSearchPayload.parse(search),
});

export const ledgerSearchPayload = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
  site_id: z.number().optional(),
  customer_id: z.number().optional(),
  date: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY")
    .optional(),
  from_date: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY")
    .optional(),
  to_date: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY")
    .optional(),
});
export type LedgerSearchPayload = z.infer<typeof ledgerSearchPayload>;

export type LedgerFiltersState = Omit<
  Pick<
    LedgerSearchPayload,
    "from_date" | "to_date" | "date" | "site_id" | "customer_id"
  >,
  "site_id" | "customer_id"
> & {
  site_id: string;
  customer_id: string;
};

function LedgerPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const page = search.page ?? 1;
  const per_page = search.per_page ?? 25;

  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  // Initialize local filters from URL search params
  const [localFilters, setLocalFilters] = useState<LedgerFiltersState>({
    site_id: search.site_id ? search.site_id.toString() : "",
    customer_id: search.customer_id ? search.customer_id.toString() : "",
    date: search.date || "",
    from_date: search.from_date || "",
    to_date: search.to_date || "",
  });

  const debouncedFilters = useDebounce(localFilters, 500);

  // --- Sync State -> URL ---
  useEffect(() => {
    navigate({
      search: (prev) => {
        const siteId = debouncedFilters.site_id
          ? parseInt(debouncedFilters.site_id, 10)
          : undefined;
        const customerId = debouncedFilters.customer_id
          ? parseInt(debouncedFilters.customer_id, 10)
          : undefined;

        const cleanSiteId = Number.isNaN(siteId || NaN) ? undefined : siteId;
        const cleanCustomerId = Number.isNaN(customerId || NaN)
          ? undefined
          : customerId;

        return {
          ...prev,
          site_id: cleanSiteId,
          customer_id: cleanCustomerId,
          date: debouncedFilters.date || undefined,
          from_date: debouncedFilters.from_date || undefined,
          to_date: debouncedFilters.to_date || undefined,
          page: 1, // Reset to page 1 on any filter change
        };
      },
      replace: true,
    });
  }, [debouncedFilters, navigate]);

  // --- Queries ---

  // const { data: stats, isLoading: isLoadingStats } = useQuery({
  //   queryKey: ["ledger", "stats"],
  //   queryFn: () => ledgerService.stats(),
  //   placeholderData: {
  //     total_received: 0,
  //     year_received: 0,
  //     total_entries: 0,
  //   },
  // });

  const { data: sitesData } = useQuery({
    queryKey: ["sites", "list-all-ledger"],
    queryFn: () => siteService.search({ page: 1, per_page: 100 }),
  });

  const siteMap = new Map(sitesData?.data.map((c) => [c.id, c]) || []);

  const { data: customersData } = useQuery({
    queryKey: ["customers", "list-all-ledger"],
    queryFn: () => customerService.search({ page: 1, per_page: 100 }),
  });

  const customerMap = new Map(customersData?.data.map((c) => [c.id, c]) || []);

  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["ledger", { ...search, page, per_page }],
    queryFn: () =>
      ledgerService.search({
        page,
        per_page,
        site_id: search.site_id,
        customer_id: search.customer_id,
        date: search.date || undefined,
        from_date: search.from_date || undefined,
        to_date: search.to_date || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  // --- Mutations ---

  const toggleProcessing = (id: number, isProcessing: boolean) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      if (isProcessing) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ledgerService.delete(id),
    onMutate: (id) => toggleProcessing(id, true),
    onSuccess: () => {
      const currentCount = data?.data.length || 0;
      if (currentCount === 1 && page > 1) {
        navigate({ search: (prev) => ({ ...prev, page: page - 1 }) });
      }
    },
    onSettled: (_data, _error, id) => {
      toggleProcessing(id, false);
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      // Invalidate sites if ledger affects balances
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
    onError: (err) => {
      console.error("Delete failed", err);
      alert("Failed to delete ledger entry.");
    },
  });

  // --- Handlers ---

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReset = () => {
    setLocalFilters({
      site_id: "",
      customer_id: "",
      date: "",
      from_date: "",
      to_date: "",
    });

    navigate({
      search: (prev) => ({
        ...prev,
        site_id: undefined,
        customer_id: undefined,
        date: undefined,
        from_date: undefined,
        to_date: undefined,
        page: 1,
      }),
      replace: true,
    });
  };

  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const handlePerPageChange = (newPerPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, per_page: newPerPage, page: 1 }),
    });
  };

  const [entryToDelete, setEntryToDelete] = useState<any | null>(null);

  const handleDelete = (entry: any) => {
    setEntryToDelete(entry);
  };

  return (
    <div className="flex-1 space-y-6 px-2 py-6 sm:p-6 md:p-8 md:pt-6 animate-in fade-in duration-500 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center justify-between pb-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Ledger
            <div className="h-6 w-px bg-zinc-800 ml-2 hidden sm:block" />
            <span className="text-sm font-medium text-zinc-500 hidden sm:block mt-1">
              Payments
            </span>
          </h2>
          <p className="text-zinc-400">
            Track incoming payments and manage transaction history.
          </p>
        </div>
        <Button
          asChild
          className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] transition-all font-medium"
        >
          <Link to="/ledger/new">
            <Plus className="mr-2 h-4 w-4" /> New Payment
          </Link>
        </Button>
      </div>

      <div className="h-px w-full bg-linear-to-r from-zinc-800 to-transparent" />

      {/* Stats Grid */}
      {/* <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 min-w-0">
        <StatsCard
          loading={isLoadingStats}
          title="Total Collected"
          value={formatCurrency(stats?.total_received || 0)}
          subText="All-time revenue collected"
          icon={<Wallet className="h-4 w-4 text-emerald-500" />}
          className="col-span-2 lg:col-span-1"
        />
        <StatsCard
          loading={isLoadingStats}
          title="This Year"
          value={formatCurrency(stats?.year_received || 0)}
          subText="Payments received this year"
          icon={<IndianRupee className="h-4 w-4 text-blue-500" />}
        />
        <StatsCard
          loading={isLoadingStats}
          title="Transactions"
          value={stats?.total_entries || 0}
          subText="Total payment entries"
          icon={<History className="h-4 w-4 text-zinc-500" />}
        />
      </div> */}

      {isError && error && <ErrorAlert error={error} />}

      <LedgerDataGrid
        data={data?.data || []}
        isLoading={isLoading}
        isPlaceholderData={isPlaceholderData}
        navigate={navigate}
        processingIds={processingIds}
        siteMap={siteMap}
        customerMap={customerMap}
        filterProps={{
          filters: localFilters,
          onChange: handleFilterChange,
          onReset: handleReset,
        }}
        paginationProps={{
          currentPage: page,
          totalPages: data?.pagination.total_pages || 0,
          perPage: per_page,
          totalCount: data?.pagination.total_count || 0,
          onPageChange: handlePageChange,
          onPerPageChange: handlePerPageChange,
        }}
        onDelete={handleDelete}
      />

      <ConfirmDialog
        isOpen={!!entryToDelete}
        onClose={() => setEntryToDelete(null)}
        onConfirm={() => {
          if (entryToDelete) {
            deleteMutation.mutate(entryToDelete.id);
            setEntryToDelete(null);
          }
        }}
        title="Delete Payment"
        description={`Are you sure you want to permanently delete payment entry #${entryToDelete?.id}? This action cannot be undone.`}
        confirmText="Delete"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
