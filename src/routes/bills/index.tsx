import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import { FileText, IndianRupee, Plus, Receipt, TrendingUp, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { BillDataGrid } from "@/components/BillDataGrid";
// Components
import { ErrorAlert } from "@/components/ErrorAlert";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  const page = search.page ?? 1;
  const per_page = search.per_page ?? 25;

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

  return (
    <div className="flex-1 space-y-6 px-2 py-6 sm:p-6 md:p-8 md:pt-6 animate-in fade-in duration-500 overflow-x-hidden">
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
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const id = formData.get("bill_id");
              if (id) {
                navigate({ to: `/bills/${id}` });
              }
            }}
            className="relative flex items-center w-full sm:w-auto"
          >
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <Input 
              type="number"
              name="bill_id"
              placeholder="Find Bill ID..."
              className="pl-9 bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50 w-full sm:w-48 h-10 shadow-sm shadow-black/20 font-mono text-sm"
            />
          </form>
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] transition-all font-medium shrink-0 h-10 w-full sm:w-auto"
          >
            <Link to="/bills/new">
              <Plus className="mr-2 h-4 w-4" /> Generate Bill
            </Link>
          </Button>
        </div>
      </div>

      <div className="h-px w-full bg-linear-to-r from-zinc-800 to-transparent" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 min-w-0">
        <StatsCard
          loading={isLoadingStats}
          title="Yearly Revenue"
          value={formatCurrency(stats?.year_total || 0)}
          subText="Billed amount this year"
          icon={<IndianRupee className="h-4 w-4 text-emerald-500" />}
          className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl"
        />
        <StatsCard
          loading={isLoadingStats}
          title="Bills Generated"
          value={stats?.year_bills || 0}
          subText="Invoices created this year"
          icon={<Receipt className="h-4 w-4 text-blue-500" />}
          className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl"
        />
        <StatsCard
          loading={isLoadingStats}
          title="Total Invoices"
          value={stats?.total_bills || 0}
          subText="All-time bill count"
          icon={<FileText className="h-4 w-4 text-zinc-500" />}
          className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl"
        />
        <StatsCard
          loading={isLoadingStats}
          title="Avg. Bill Value"
          value={formatCurrency(
            (stats?.year_total || 0) / (stats?.year_bills || 1),
          )}
          subText="Average invoice size"
          icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
          className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl"
        />
      </div>

      {isError && error && <ErrorAlert error={error} />}

      <BillDataGrid
        data={data?.data || []}
        isLoading={isLoading}
        isPlaceholderData={isPlaceholderData}
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
      />
    </div>
  );
}
