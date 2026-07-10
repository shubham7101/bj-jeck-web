import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

// Components
import { ErrorAlert } from "@/components/ErrorAlert";
import { RecordDataGrid } from "@/components/RecordDataGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Hooks & Services
import { useDebounce } from "@/hooks/use-debounce";
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

  const page = search.page ?? 1;
  const per_page = search.per_page ?? 25;

  const [localFilters, setLocalFilters] = useState<{
    [K in keyof RecordSearchReq]: string;
  }>({
    from_date: search.from_date || "",
    to_date: search.to_date || "",
    site_id: search.site_id ? search.site_id.toString() : "",
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
        const siteId = debouncedFilters.site_id
          ? parseInt(debouncedFilters.site_id, 10)
          : undefined;
        const billId = debouncedFilters.bill_id
          ? parseInt(debouncedFilters.bill_id, 10)
          : undefined;

        // Ensure we don't pass NaN
        const cleanSiteId = Number.isNaN(siteId || NaN) ? undefined : siteId;
        const cleanBillId = Number.isNaN(billId || NaN) ? undefined : billId;

        return {
          ...prev,
          from_date: debouncedFilters.from_date || undefined,
          to_date: debouncedFilters.to_date || undefined,
          site_id: cleanSiteId,
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

  // const { data: stats, isLoading: isLoadingStats } = useQuery({
  //   queryKey: ["records", "stats"],
  //   queryFn: () => recordService.stats(),
  // });

  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["records", { ...search, page, per_page }],
    queryFn: () =>
      recordService.search({
        page,
        per_page,
        from_date: search.from_date || undefined,
        to_date: search.to_date || undefined,
        site_id: search.site_id,
        date: search.date || undefined,
        vehicle_no: search.vehicle_no || undefined,
        vehicle_mobile_no: search.vehicle_mobile_no || undefined,
        bill_id: search.bill_id,
      }),
    placeholderData: keepPreviousData,
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
      site_id: "",
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
        site_id: undefined,
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

  return (
    <div className="flex-1 space-y-6 px-2 py-6 sm:p-6 md:p-8 md:pt-6 animate-in fade-in duration-500 overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center justify-between pb-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Records
            <div className="h-6 w-px bg-zinc-800 ml-2 hidden sm:block" />
            <span className="text-sm font-medium text-zinc-500 hidden sm:block mt-1">
              Inventory
            </span>
          </h2>
          <p className="text-zinc-400">
            Manage chalans, track dynamic item valuations, and view transaction
            history.
          </p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const id = formData.get("record_id");
              if (id) {
                navigate({ to: `/records/${id}` });
              }
            }}
            className="relative flex items-center w-full sm:w-auto"
          >
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <Input
              type="number"
              name="record_id"
              placeholder="Find Chalan No..."
              className="pl-9 bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50 w-full sm:w-48 h-10 shadow-sm shadow-black/20 font-mono text-sm"
            />
          </form>
          <Button
            asChild
            className="bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_-5px_rgba(217,119,6,0.3)] transition-all font-medium shrink-0 h-10 w-full sm:w-auto"
          >
            <Link to="/records/new">
              <Plus className="mr-2 h-4 w-4" /> New Record
            </Link>
          </Button>
        </div>
      </div>

      <div className="h-px w-full bg-linear-to-r from-zinc-800 to-transparent" />

      {/* <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatsCard
          loading={isLoadingStats}
          title="Yearly Labour"
          value={`₹${stats?.year_labour.toLocaleString() ?? 0}`}
          valueColor="text-emerald-400 font-mono tracking-tight font-extrabold text-2xl"
          subText="Labour charges collected this year"
          icon={<IndianRupee className="h-4 w-4 text-emerald-500" />}
          className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl"
        >
          <div className={themeStyles.accentBarEmerald} />
        </StatsCard>

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
          className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl"
        >
          <div className={themeStyles.accentBarBlue} />
        </StatsCard>

        <StatsCard
          loading={isLoadingStats}
          title="Damaged Items"
          value={stats?.year_broken ?? 0}
          valueColor="text-amber-400 font-mono tracking-tight font-extrabold text-2xl"
          subText="Broken pieces reported this year"
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl"
        >
          <div className={themeStyles.accentBarPrimary} />
        </StatsCard>

        <StatsCard
          loading={isLoadingStats}
          title="Total Records"
          value={stats?.total_records ?? 0}
          valueColor="text-zinc-100 font-mono tracking-tight font-extrabold text-2xl"
          subText="All-time transaction count"
          icon={<Database className="h-4 w-4 text-zinc-400" />}
          className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl"
        >
          <div className={themeStyles.accentBarZinc} />
        </StatsCard>
      </div> */}

      {isError && error && <ErrorAlert error={error} />}

      <RecordDataGrid
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
