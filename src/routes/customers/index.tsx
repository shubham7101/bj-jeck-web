import type z from "zod";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { CustomerDataGrid } from "@/components/CustomerDataGrid";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { customerService } from "@/services/customerService";
import { customerSearchReqSchema } from "@/schemas/customerSchema";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers/",
  component: CustomersPage,
  validateSearch: (search) => customerSearchReqSchema.parse(search),
});

type CustomersFiltersState = Pick<
  z.infer<typeof customerSearchReqSchema>,
  "name" | "mobile_no"
>;

function CustomersPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const page = search.page ?? 1;
  const per_page = search.per_page ?? 25;

  const [localFilters, setLocalFilters] = useState<CustomersFiltersState>({
    name: search.name || "",
    mobile_no: search.mobile_no || "",
  });

  const debouncedFilters = useDebounce(localFilters, 500);

  // Sync Debounced State -> URL
  useEffect(() => {
    navigate({
      search: (prev) => {
        const filtersChanged =
          prev.name !== (debouncedFilters.name || undefined) ||
          prev.mobile_no !== (debouncedFilters.mobile_no || undefined);

        if (!filtersChanged) return prev;

        return {
          ...prev,
          name: debouncedFilters.name || undefined,
          mobile_no: debouncedFilters.mobile_no || undefined,
          page: 1, // Reset to page 1 ONLY on filter change
        };
      },
      replace: true,
    });
  }, [debouncedFilters, navigate]);

  // --- Queries ---

  // Fetch List Data
  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["customers", { ...search, page, per_page }],
    queryFn: () =>
      customerService.search({
        page,
        per_page,
        name: search.name || undefined,
        mobile_no: search.mobile_no || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  // --- Handlers ---

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalFilters((prev) => ({
      ...prev,
      [name as keyof CustomersFiltersState]: value,
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
    setLocalFilters({ name: "", mobile_no: "" });
    navigate({
      search: (prev) => ({
        ...prev,
        name: undefined,
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
            Master Customers
            <div className="h-6 w-px bg-zinc-800 ml-2 hidden sm:block" />
            <span className="text-sm font-medium text-zinc-500 hidden sm:block mt-1">
              Directory
            </span>
          </h2>
          <p className="text-zinc-400">
            Manage master customer profiles and their core details.
          </p>
        </div>
        <Button
          asChild
          className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)] transition-all font-medium"
        >
          <Link to="/customers/new">
            <Plus className="mr-2 h-4 w-4" /> Add Master Customer
          </Link>
        </Button>
      </div>

      <div className="h-px w-full bg-linear-to-r from-zinc-800 to-transparent" />

      {isError && error && <ErrorAlert error={error} />}

      <CustomerDataGrid
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
