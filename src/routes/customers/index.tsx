import { useDebounce } from "@/hooks/use-debounce";
import {
  customerSearchReqSchema,
  type Customer,
} from "@/schemas/customerSchema";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { customerService } from "@/services/customerService";
import { z } from "zod";

import { CustomerDataGrid } from "@/components/CustomerDataGrid";
import { Button } from "@/components/ui/button";
import { Plus, UserCheck, Users, UserX } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { ErrorAlert } from "@/components/ErrorAlert";

export const Route = createFileRoute("/customers/")({
  component: CustomerPage,
  validateSearch: (search) => customerSearchReqSchema.parse(search),
});

type CustomerFiltersState = Pick<
  z.infer<typeof customerSearchReqSchema>,
  "name" | "address" | "mobile_no"
>;

function CustomerPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const page = search.page ?? 1;
  const per_page = search.per_page ?? 10;

  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const [localFilters, setLocalFilters] = useState<CustomerFiltersState>({
    name: search.name || "",
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
          name: debouncedFilters.name || undefined,
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
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["customers", "stats"],
    queryFn: () => customerService.stats(),
  });

  // 2. Fetch List Data
  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["customers", { ...search, page, per_page }],
    queryFn: () =>
      customerService.search({
        page,
        per_page,
        name: search.name || undefined,
        mobile_no: search.mobile_no || undefined,
        address: search.address || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  // --- Helpers & Mutations ---

  const toggleProcessing = (id: number, isProcessing: boolean) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      if (isProcessing) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      customerService.setActive(id, active),
    onMutate: ({ id }) => toggleProcessing(id, true),
    onSettled: (_data, _error, { id }) => {
      toggleProcessing(id, false);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err) => {
      console.error("Status update failed", err);
      alert("Failed to update status. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customerService.delete(id),
    onMutate: (id) => toggleProcessing(id, true),
    onSuccess: () => {
      const currentCount = data?.data.length || 0;
      if (currentCount === 1 && page > 1) {
        navigate({ search: (prev) => ({ ...prev, page: page - 1 }) });
      }
    },
    onSettled: (_data, _error, id) => {
      toggleProcessing(id, false);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err) => {
      console.error("Delete failed", err);
      alert("Failed to delete customer. Please try again.");
    },
  });

  // --- Handlers ---

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalFilters((prev) => ({
      ...prev,
      [name as keyof CustomerFiltersState]: value,
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
    setLocalFilters({ name: "", address: "", mobile_no: "" });
    navigate({
      search: (prev) => ({
        ...prev,
        name: undefined,
        address: undefined,
        mobile_no: undefined,
        page: 1,
      }),
      replace: true,
    });
  };

  const handleToggleStatus = (customer: Customer) => {
    toggleStatusMutation.mutate({ id: customer.id, active: !customer.active });
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Customers
          </h2>
          <p className="text-muted-foreground">
            Manage customer details, track rentals, and view history.
          </p>
        </div>
        <Button asChild>
          <Link to="/customers/new">
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Link>
        </Button>
      </div>
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          loading={isLoadingStats}
          title="Total Customers"
          value={stats?.total ?? 0}
          subText="Recorded in system"
          icon={<Users className="h-4 w-4 text-zinc-400" />}
        />
        <StatsCard
          loading={isLoadingStats}
          title="Active Customers"
          value={stats?.active ?? 0}
          subText="Currently renting items"
          icon={<UserCheck className="h-4 w-4 text-emerald-500" />}
        />
        <StatsCard
          loading={isLoadingStats}
          title="Inactive Customers"
          value={stats?.inactive ?? 0}
          subText="No active rentals"
          icon={<UserX className="h-4 w-4 text-rose-500" />}
        />
      </div>
      {isError && error && <ErrorAlert error={error} />}

      <CustomerDataGrid
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
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}
