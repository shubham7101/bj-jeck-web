import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import {
  AlertTriangle,
  ArrowRightLeft,
  Database,
  IndianRupee,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";

// Components
import { ErrorAlert } from "@/components/ErrorAlert";
import { RecordDataGrid } from "@/components/RecordDataGrid";
import { StatsCard } from "@/components/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Hooks & Services
import { useDebounce } from "@/hooks/use-debounce";
import { themeStyles } from "@/lib/styles";
import {
  type RecordSearchReq,
  recordSearchReqSchema,
} from "@/schemas/recordSchema";
import { recordService } from "@/services/recordService";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/records/",
  component: RecordPage,
  validateSearch: (search) => recordSearchReqSchema.parse(search),
});

function RecordPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const page = search.page ?? 1;
  const per_page = search.per_page ?? 25;

  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  // We explicitly type this state as Record<Key, string> to handle form inputs
  // which are always strings. We avoid 'as any' casting.
  const [localFilters, setLocalFilters] = useState<{
    [K in keyof RecordSearchReq]: string;
  }>({
    from_date: search.from_date || "",
    to_date: search.to_date || "",
    customer_id: search.customer_id ? search.customer_id.toString() : "",
    date: search.date || "",
    vehicle_no: search.vehicle_no || "",
    vehicle_mobile_no: search.vehicle_mobile_no || "",
    bill_id: search.bill_id ? search.bill_id.toString() : "",
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
        const billId = debouncedFilters.bill_id
          ? parseInt(debouncedFilters.bill_id, 10)
          : undefined;

        // Ensure we don't pass NaN
        const cleanCustomerId = Number.isNaN(customerId || NaN)
          ? undefined
          : customerId;
        const cleanBillId = Number.isNaN(billId || NaN) ? undefined : billId;

        return {
          ...prev,
          from_date: debouncedFilters.from_date || undefined,
          to_date: debouncedFilters.to_date || undefined,
          customer_id: cleanCustomerId,
          date: debouncedFilters.date || undefined,
          vehicle_no: debouncedFilters.vehicle_no || undefined,
          vehicle_mobile_no: debouncedFilters.vehicle_mobile_no || undefined,
          bill_id: cleanBillId,
          page: 1, // Reset to page 1 on filter change
        };
      },
      replace: true,
    });
  }, [debouncedFilters, navigate]);

  // --- Queries ---

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["records", "stats"],
    queryFn: () => recordService.stats(),
  });

  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["records", { ...search, page, per_page }],
    queryFn: () =>
      recordService.search({
        page,
        per_page,
        from_date: search.from_date || undefined,
        to_date: search.to_date || undefined,
        customer_id: search.customer_id,
        date: search.date || undefined,
        vehicle_no: search.vehicle_no || undefined,
        vehicle_mobile_no: search.vehicle_mobile_no || undefined,
        bill_id: search.bill_id,
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
    mutationFn: (id: number) => recordService.delete(id),
    onMutate: (id) => toggleProcessing(id, true),
    onSuccess: () => {
      const currentCount = data?.data.length || 0;
      if (currentCount === 1 && page > 1) {
        navigate({ search: (prev) => ({ ...prev, page: page - 1 }) });
      }
    },
    onSettled: (_data, _error, id) => {
      toggleProcessing(id, false);
      queryClient.invalidateQueries({ queryKey: ["records"] });
    },
    onError: (err) => {
      console.error("Delete failed", err);
      alert("Failed to delete record.");
    },
  });

  // --- Handlers ---

  const handleFilterChange = (key: keyof RecordSearchReq, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setLocalFilters({
      from_date: "",
      to_date: "",
      customer_id: "",
      date: "",
      vehicle_no: "",
      vehicle_mobile_no: "",
      bill_id: "",
    });

    navigate({
      search: (prev) => ({
        ...prev,
        from_date: undefined,
        to_date: undefined,
        customer_id: undefined,
        date: undefined,
        vehicle_no: undefined,
        vehicle_mobile_no: undefined,
        bill_id: undefined,
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

  const handleDelete = (record: any) => {
    if (confirm(`Are you sure you want to delete record #${record.id}?`)) {
      deleteMutation.mutate(record.id);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 animate-in fade-in duration-500">
      {/* Glassmorphic Header Card */}
      <div className={themeStyles.glassHeader}>
        <div className={themeStyles.glassHeaderOverlay} />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={themeStyles.glassHeaderIconContainer}>
                <Database className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Records
              </h2>
              <Badge
                variant="outline"
                className="bg-zinc-900/80 text-zinc-400 border-zinc-800 text-[10px] uppercase font-bold tracking-wider py-0.5 px-2"
              >
                Inventory
              </Badge>
            </div>
            <p className="text-sm text-zinc-400">
              Manage chalans, track dynamic item valuations, and view
              transaction history.
            </p>
          </div>
          <Button
            asChild
            className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 self-start sm:self-center px-5 h-10 rounded-xl"
          >
            <Link to="/records/new">
              <Plus className="mr-2 h-4 w-4 stroke-[2.5]" /> New Record
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* 1. Yearly Labour */}
        <StatsCard
          loading={isLoadingStats}
          title="Yearly Labour"
          value={`₹${stats?.year_labour.toLocaleString() ?? 0}`}
          valueColor="text-emerald-400 font-mono tracking-tight font-extrabold text-2xl"
          subText="Labour charges collected this year"
          icon={<IndianRupee className="h-4 w-4 text-emerald-500" />}
        >
          <div className={themeStyles.accentBarEmerald} />
        </StatsCard>

        {/* 2. Yearly Flow */}
        <StatsCard
          loading={isLoadingStats}
          title="Yearly Flow"
          value={stats?.year_records ?? 0}
          valueColor="text-blue-400 font-mono tracking-tight font-extrabold text-2xl"
          subText={
            <span className="flex items-center gap-2">
              <span className="text-emerald-500 font-medium">
                {stats?.year_in ?? 0} IN
              </span>
              <span className="text-zinc-650">•</span>
              <span className="text-rose-500 font-medium">
                {stats?.year_out ?? 0} OUT
              </span>
            </span>
          }
          icon={<ArrowRightLeft className="h-4 w-4 text-blue-500" />}
        >
          <div className={themeStyles.accentBarBlue} />
        </StatsCard>

        {/* 3. Damaged Items */}
        <StatsCard
          loading={isLoadingStats}
          title="Damaged Items"
          value={stats?.year_broken ?? 0}
          valueColor="text-amber-400 font-mono tracking-tight font-extrabold text-2xl"
          subText="Broken pieces reported this year"
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
        >
          <div className={themeStyles.accentBarPrimary} />
        </StatsCard>

        {/* 4. Total Records */}
        <StatsCard
          loading={isLoadingStats}
          title="Total Records"
          value={stats?.total_records ?? 0}
          valueColor="text-zinc-100 font-mono tracking-tight font-extrabold text-2xl"
          subText="All-time transaction count"
          icon={<Database className="h-4 w-4 text-zinc-400" />}
        >
          <div className={themeStyles.accentBarZinc} />
        </StatsCard>
      </div>

      {isError && error && <ErrorAlert error={error} />}

      <RecordDataGrid
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
