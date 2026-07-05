import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import { FileText, IndianRupee, Plus, Receipt, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { BillDataGrid } from "@/components/BillDataGrid";
// Components
import { ErrorAlert } from "@/components/ErrorAlert";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";

// Hooks & Services
import { useDebounce } from "@/hooks/use-debounce";
import { type BillSearchReq, billSearchReqSchema } from "@/schemas/billSchema";
import { billService } from "@/services/billService";
import { formatCurrency } from "@/utils";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bills/",
  component: BillsPage,
  validateSearch: (search) => billSearchReqSchema.parse(search),
});

function BillsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const page = search.page ?? 1;
  const per_page = search.per_page ?? 25;

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
          ? parseInt(debouncedFilters.customer_id, 10)
          : undefined;

        // Ensure we don't pass NaN
        const cleanCustomerId = Number.isNaN(customerId || NaN)
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
      year_total: 0,
      year_bills: 0,
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
      {/* Header Section */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center justify-between pb-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Invoices
            <div className="h-6 w-px bg-zinc-800 ml-2 hidden sm:block" />
            <span className="text-sm font-medium text-zinc-500 hidden sm:block mt-1">
              Billing
            </span>
          </h2>
          <p className="text-zinc-400">
            View generated bills, track payments, and manage history.
          </p>
        </div>
        <Button
          asChild
          className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] transition-all font-medium"
        >
          <Link to="/bills/new">
            <Plus className="mr-2 h-4 w-4" /> Generate Bill
          </Link>
        </Button>
      </div>

      <div className="h-px w-full bg-linear-to-r from-zinc-800 to-transparent" />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          loading={isLoadingStats}
          title="Yearly Revenue"
          value={formatCurrency(stats?.year_total || 0)}
          subText="Billed amount this year"
          icon={<IndianRupee className="h-4 w-4 text-emerald-500" />}
        />
        <StatsCard
          loading={isLoadingStats}
          title="Bills Generated"
          value={stats?.year_bills || 0}
          subText="Invoices created this year"
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
          value={formatCurrency(
            (stats?.year_total || 0) / (stats?.year_bills || 1),
          )}
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
