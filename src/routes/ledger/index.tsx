import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { IndianRupee, Plus, Wallet, History } from "lucide-react";

// Components
import { ErrorAlert } from "@/components/ErrorAlert";
import { LedgerDataGrid } from "@/components/LedgerDataGrid";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";

// Hooks & Services
import { useDebounce } from "@/hooks/use-debounce";
import { ledgerService } from "@/services/ledgerService";
import {
  ledgerSearchReqSchema,
  type LedgerSearchReq,
} from "@/schemas/ledgerSchema";

export const Route = createFileRoute("/ledger/")({
  component: LedgerPage,
  validateSearch: (search) => ledgerSearchReqSchema.parse(search),
});

// Explicitly define the local filter state shape (all strings for inputs)
type LedgerLocalFilters = {
  customer_id: string;
  date: string;
  from_date: string;
  to_date: string;
};

function LedgerPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const page = search.page ?? 1;
  const per_page = search.per_page ?? 10;

  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  // Initialize local filters from URL search params
  const [localFilters, setLocalFilters] = useState<LedgerLocalFilters>({
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
        const customerId = debouncedFilters.customer_id
          ? parseInt(debouncedFilters.customer_id)
          : undefined;

        // Ensure we don't pass NaN for IDs
        const cleanCustomerId = isNaN(customerId || NaN)
          ? undefined
          : customerId;

        return {
          ...prev,
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

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["ledger", "stats"],
    queryFn: () => ledgerService.stats(),
    placeholderData: {
      total_received: 0,
      month_received: 0,
      total_entries: 0,
    },
  });

  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["ledger", { ...search, page, per_page }],
    queryFn: () =>
      ledgerService.search({
        page,
        per_page,
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
      // Invalidate customers if ledger affects balances
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err) => {
      console.error("Delete failed", err);
      alert("Failed to delete ledger entry.");
    },
  });

  // --- Handlers ---

  const handleFilterChange = (key: keyof LedgerSearchReq, value: string) => {
    // Only update if the key exists in our local state map
    // We cast key to ensure TS knows it matches LedgerLocalFilters keys
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setLocalFilters({
      customer_id: "",
      date: "",
      from_date: "",
      to_date: "",
    });

    navigate({
      search: (prev) => ({
        ...prev,
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

  const handleDelete = (entry: any) => {
    if (
      confirm(`Are you sure you want to delete payment entry #${entry.id}?`)
    ) {
      deleteMutation.mutate(entry.id);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Payment Ledger
          </h2>
          <p className="text-muted-foreground">
            Track incoming payments and manage transaction history.
          </p>
        </div>
        <Link to={`/ledger/new`}>
          <Button className="bg-white text-zinc-950 hover:bg-zinc-200 font-semibold shadow-lg shadow-zinc-950/20 transition-all cursor-pointer">
            <Plus className="mr-2 h-4 w-4" /> New Payment
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          loading={isLoadingStats}
          title="Total Collected"
          value={`₹${(stats?.total_received || 0).toLocaleString()}`}
          subText="All-time revenue collected"
          icon={<Wallet className="h-4 w-4 text-emerald-500" />}
        />
        <StatsCard
          loading={isLoadingStats}
          title="This Month"
          value={`₹${(stats?.month_received || 0).toLocaleString()}`}
          subText="Payments received this month"
          icon={<IndianRupee className="h-4 w-4 text-blue-500" />}
        />
        <StatsCard
          loading={isLoadingStats}
          title="Transactions"
          value={stats?.total_entries || 0}
          subText="Total payment entries"
          icon={<History className="h-4 w-4 text-zinc-500" />}
        />
      </div>

      {isError && error && <ErrorAlert error={error} />}

      <LedgerDataGrid
        data={data?.data || []}
        isLoading={isLoading}
        isPlaceholderData={isPlaceholderData}
        navigate={navigate}
        processingIds={processingIds}
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
    </div>
  );
}
