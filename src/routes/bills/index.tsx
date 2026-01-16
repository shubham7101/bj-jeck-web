import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { FileText, IndianRupee, Plus, TrendingUp, Receipt } from "lucide-react";

// Components
import { ErrorAlert } from "@/components/ErrorAlert";
import { BillDataGrid } from "@/components/BillDataGrid";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";

// Hooks & Services
import { useDebounce } from "@/hooks/use-debounce";
import { billService } from "@/services/billService";
import { billSearchReqSchema, type BillSearchReq } from "@/schemas/billSchema";

export const Route = createFileRoute("/bills/")({
  component: BillsPage,
  validateSearch: (search) => billSearchReqSchema.parse(search),
});

function BillsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const page = search.page ?? 1;
  const per_page = search.per_page ?? 10;

  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  // Local state for filters to allow typing before debouncing
  const [localFilters, setLocalFilters] = useState<{
    [K in keyof BillSearchReq]: string;
  }>({
    date: search.date || "",
    customer_id: search.customer_id ? search.customer_id.toString() : "",
    khata_no: search.khata_no || "",
  });

  const debouncedFilters = useDebounce(localFilters, 500);

  // --- Sync State -> URL ---
  useEffect(() => {
    navigate({
      search: (prev) => {
        // Parse strings back to numbers/undefined for the URL schema
        const customerId = debouncedFilters.customer_id
          ? parseInt(debouncedFilters.customer_id)
          : undefined;

        // Ensure we don't pass NaN
        const cleanCustomerId = isNaN(customerId || NaN)
          ? undefined
          : customerId;

        return {
          ...prev,
          date: debouncedFilters.date || undefined,
          customer_id: cleanCustomerId,
          khata_no: debouncedFilters.khata_no || undefined,
          page: 1, // Reset to page 1 on filter change
        };
      },
      replace: true,
    });
  }, [debouncedFilters, navigate]);

  // --- Queries ---

  // Assuming you have a stats endpoint for bills, otherwise remove or adapt
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["bills", "stats"],
    queryFn: () => billService.stats(),
    placeholderData: {
      month_total: 0,
      month_bills: 0,
      total_bills: 0,
    },
  });

  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["bills", { ...search, page, per_page }],
    queryFn: () =>
      billService.search({
        page,
        per_page,
        date: search.date || undefined,
        customer_id: search.customer_id,
        khata_no: search.khata_no || undefined,
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
    mutationFn: (id: number) => billService.delete(id),
    onMutate: (id) => toggleProcessing(id, true),
    onSuccess: () => {
      const currentCount = data?.data.length || 0;
      if (currentCount === 1 && page > 1) {
        navigate({ search: (prev) => ({ ...prev, page: page - 1 }) });
      }
    },
    onSettled: (_data, _error, id) => {
      toggleProcessing(id, false);
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["records"] }); // Deleting a bill unlocks records
    },
    onError: (err) => {
      console.error("Delete failed", err);
      alert("Failed to delete bill.");
    },
  });

  // --- Handlers ---

  const handleFilterChange = (key: keyof BillSearchReq, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setLocalFilters({
      date: "",
      customer_id: "",
      khata_no: "",
    });

    navigate({
      search: (prev) => ({
        ...prev,
        from_date: undefined,
        to_date: undefined,
        customer_id: undefined,
        bill_id: undefined,
        khata_no: undefined,
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

  const handleDelete = (bill: any) => {
    if (confirm(`Are you sure you want to delete Bill #${bill.id}?`)) {
      deleteMutation.mutate(bill.id);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Invoices
          </h2>
          <p className="text-muted-foreground">
            View generated bills, track payments, and manage history.
          </p>
        </div>
        <Link to={`/bills/new`}>
          <Button className="bg-white text-zinc-950 hover:bg-zinc-200 font-semibold shadow-lg shadow-zinc-950/20 transition-all cursor-pointer">
            <Plus className="mr-2 h-4 w-4" /> Generate Bill
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          loading={isLoadingStats}
          title="Monthly Revenue"
          value={`₹${(stats?.month_total || 0).toLocaleString()}`}
          subText="Billed amount this month"
          icon={<IndianRupee className="h-4 w-4 text-emerald-500" />}
        />
        <StatsCard
          loading={isLoadingStats}
          title="Bills Generated"
          value={stats?.month_bills || 0}
          subText="Invoices created this month"
          icon={<Receipt className="h-4 w-4 text-blue-500" />}
        />
        <StatsCard
          loading={isLoadingStats}
          title="Total Invoices"
          value={stats?.total_bills || 0}
          subText="All-time bill count"
          icon={<FileText className="h-4 w-4 text-zinc-500" />}
        />
        <StatsCard
          loading={isLoadingStats}
          title="Avg. Bill Value"
          value={`₹${Math.round((stats?.month_total || 0) / (stats?.month_bills || 1)).toLocaleString()}`}
          subText="Average invoice size"
          icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
        />
      </div>

      {isError && error && <ErrorAlert error={error} />}

      <BillDataGrid
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
