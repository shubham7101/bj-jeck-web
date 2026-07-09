import z from "zod";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteDataGrid } from "@/components/SiteDataGrid";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { siteService } from "@/services/siteService";
import { siteSearchReqSchema } from "@/schemas/siteSchema";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sites/",
  component: SitesPage,
  validateSearch: (search) => siteSearchReqSchema.parse(search),
});

type SitesFiltersState = Pick<
  z.infer<typeof siteSearchReqSchema>,
  "contractor_name" | "address" | "mobile_no"
>;

function SitesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const page = search.page ?? 1;
  const per_page = search.per_page ?? 25;

  const [localFilters, setLocalFilters] = useState<SitesFiltersState>({
    contractor_name: search.contractor_name || "",
    address: search.address || "",
    mobile_no: search.mobile_no || "",
  });

  const debouncedFilters = useDebounce(localFilters, 500);

  // Sync Debounced State -> URL
  useEffect(() => {
    navigate({
      search: (prev) => {
        return {
          ...prev,
          contractor_name: debouncedFilters.contractor_name || undefined,
          address: debouncedFilters.address || undefined,
          mobile_no: debouncedFilters.mobile_no || undefined,
          page: 1, // Reset to page 1 on filter change
        };
      },
      replace: true,
    });
  }, [debouncedFilters, navigate]);

  // --- Queries ---

  // 1. Fetch Stats
  // const { data: stats, isLoading: isLoadingStats } = useQuery({
  //   queryKey: ["customers", "stats"],
  //   queryFn: () => customerService.stats(),
  // });

  // 2. Fetch List Data
  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["sites", { ...search, page, per_page }],
    queryFn: () =>
      siteService.search({
        page,
        per_page,
        contractor_name: search.contractor_name || undefined,
        mobile_no: search.mobile_no || undefined,
        address: search.address || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  // --- Handlers ---

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalFilters((prev) => ({
      ...prev,
      [name as keyof SitesFiltersState]: value,
    }));
  };

  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const handlePerPageChange = (newPerPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, per_page: newPerPage, page: 1 }),
    });
  };

  const handleReset = () => {
    setLocalFilters({ contractor_name: "", address: "", mobile_no: "" });
    navigate({
      search: (prev) => ({
        ...prev,
        contractor_name: undefined,
        address: undefined,
        mobile_no: undefined,
        page: 1,
      }),
      replace: true,
    });
  };

  return (
    <div className="flex-1 space-y-6 px-2 py-6 sm:p-6 md:p-8 md:pt-6 animate-in fade-in duration-500 overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center justify-between pb-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Sites
            <div className="h-6 w-px bg-zinc-800 ml-2 hidden sm:block" />
            <span className="text-sm font-medium text-zinc-500 hidden sm:block mt-1">
              Directory
            </span>
          </h2>
          <p className="text-zinc-400">
            Manage client profiles, contact details, and their active rental
            status.
          </p>
        </div>
        <Button
          asChild
          className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] transition-all font-medium"
        >
          <Link to="/customers/new">
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Link>
        </Button>
      </div>

      <div className="h-px w-full bg-linear-to-r from-zinc-800 to-transparent" />

      {/* Stats Grid */}
      {/* <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3">
        <StatsCard
          loading={isLoadingStats}
          title="Total Customers"
          value={stats?.total ?? 0}
          subText="Recorded in system"
          icon={<Users className="h-4 w-4 text-emerald-400" />}
          className="col-span-2 md:col-span-1 bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl"
        />
        <StatsCard
          loading={isLoadingStats}
          title="Active Customers"
          value={stats?.active ?? 0}
          subText="Currently renting items"
          icon={<UserCheck className="h-4 w-4 text-emerald-500" />}
          className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        </StatsCard>
        <StatsCard
          loading={isLoadingStats}
          title="Inactive Customers"
          value={stats?.inactive ?? 0}
          subText="No active rentals"
          icon={<UserX className="h-4 w-4 text-rose-500" />}
          className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl"
        />
      </div> */}
      {isError && error && <ErrorAlert error={error} />}

      <SiteDataGrid
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
