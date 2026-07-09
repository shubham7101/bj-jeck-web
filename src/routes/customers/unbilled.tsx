import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import { format, parse } from "date-fns";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { CustomerDataGrid } from "@/components/CustomerDataGrid";
import { ErrorAlert } from "@/components/ErrorAlert";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Customer } from "@/schemas/customerSchema";
import { customerService } from "@/services/customerService";

const unbilledSearchSchema = z.object({
  date: z.string().optional(),
});

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers/unbilled",
  component: RouteComponent,
  validateSearch: (search) => unbilledSearchSchema.parse(search),
});

type CustomerFiltersState = {
  name: string;
  mobile_no: string;
  address: string;
};

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const dateParam = search.date;

  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  // Local text filters (client-side filtering)
  const [localFilters, setLocalFilters] = useState<CustomerFiltersState>({
    name: "",
    mobile_no: "",
    address: "",
  });

  // --- Queries ---

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customers", "unbilled", dateParam],
    queryFn: () => customerService.unbilled(dateParam),
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
      [name]: value,
    }));
  };

  const handleReset = () => {
    setLocalFilters({ name: "", address: "", mobile_no: "" });
  };

  const handleToggleStatus = (customer: Customer) => {
    toggleStatusMutation.mutate({ id: customer.id, active: !customer.active });
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  // --- Client-side filtering ---
  const filteredData = (data || []).filter((customer) => {
    const nameMatch = customer.name
      .toLowerCase()
      .includes(localFilters.name.toLowerCase());
    const mobileMatch = customer.mobile_no
      .toLowerCase()
      .includes(localFilters.mobile_no.toLowerCase());
    const addressMatch = customer.address
      .toLowerCase()
      .includes(localFilters.address.toLowerCase());
    return nameMatch && mobileMatch && addressMatch;
  });

  // Compute stats in real-time from the filtered list (or full list)
  const totalCount = data?.length ?? 0;
  const activeCount = data?.filter((c) => c.active).length ?? 0;
  const inactiveCount = data?.filter((c) => !c.active).length ?? 0;

  return (
    <div className="flex-1 space-y-6 px-2 py-6 sm:p-6 md:p-8 md:pt-6 animate-in fade-in duration-500 overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center justify-between pb-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Unbilled Customers
            <div className="h-6 w-px bg-zinc-800 ml-2 hidden sm:block" />
            <span className="text-sm font-medium text-zinc-500 hidden sm:block mt-1">
              Outstanding
            </span>
          </h2>
          <p className="text-zinc-400">
            View all client profiles that have unbilled records pending in the
            system.
          </p>
        </div>
        <Button
          variant="outline"
          asChild
          className="border-zinc-700 bg-zinc-950/50 hover:bg-zinc-900 text-zinc-300 shadow-[0_0_20px_-5px_rgba(39,39,42,0.3)] transition-all font-medium cursor-pointer"
        >
          <Link to="/customers">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
          </Link>
        </Button>
      </div>

      <div className="h-px w-full bg-linear-to-r from-zinc-800 to-transparent" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3">
        <StatsCard
          loading={isLoading}
          title="Total Unbilled Customers"
          value={totalCount}
          subText="With pending records"
          icon={<Users className="h-4 w-4 text-amber-400" />}
          className="col-span-2 md:col-span-1 bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl"
        />
        <StatsCard
          loading={isLoading}
          title="Active Customers"
          value={activeCount}
          subText="Currently renting items"
          icon={<UserCheck className="h-4 w-4 text-emerald-500" />}
          className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        </StatsCard>
        <StatsCard
          loading={isLoading}
          title="Inactive Customers"
          value={inactiveCount}
          subText="Pending records but inactive"
          icon={<UserX className="h-4 w-4 text-rose-500" />}
          className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl"
        />
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60 shadow-lg backdrop-blur-xl">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <span className="text-sm font-semibold text-zinc-300">
            As of Date
          </span>
          <span className="text-xs text-zinc-500">
            Show customers with unbilled records on or before this date
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-60 justify-start text-left font-normal bg-zinc-950/50 border-zinc-800 hover:bg-zinc-900/50 focus:ring-1 focus:ring-emerald-500/50 rounded-xl transition-all cursor-pointer",
                  !dateParam && "text-zinc-500",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500 shrink-0" />
                <span className="truncate">
                  {dateParam ? (
                    format(
                      parse(dateParam, "yyyy-MM-dd", new Date()),
                      "dd MMM yyyy",
                    )
                  ) : (
                    "All Dates"
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-zinc-950 border-zinc-800"
              align="end"
            >
              <Calendar
                mode="single"
                selected={
                  dateParam
                    ? parse(dateParam, "yyyy-MM-dd", new Date())
                    : undefined
                }
                onSelect={(date) => {
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      date: date ? format(date, "yyyy-MM-dd") : undefined,
                    }),
                    replace: true,
                  });
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {dateParam && (
            <Button
              variant="ghost"
              onClick={() =>
                navigate({
                  search: (prev) => ({ ...prev, date: undefined }),
                  replace: true,
                })
              }
              className="w-full sm:w-auto text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-300 border border-rose-500/20 rounded-xl px-3 h-10 cursor-pointer"
            >
              Reset Date
            </Button>
          )}
        </div>
      </div>

      {isError && error && <ErrorAlert error={error} />}

      <CustomerDataGrid
        data={filteredData}
        isLoading={isLoading}
        isPlaceholderData={false}
        filterProps={{
          filters: localFilters,
          onChange: handleFilterChange,
          onReset: handleReset,
        }}
      />
    </div>
  );
}
