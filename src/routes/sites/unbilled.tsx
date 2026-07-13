import { useQuery } from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { format, lastDayOfMonth, parse, subMonths } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { ErrorAlert } from "@/components/ErrorAlert";
import { FilterDatePicker } from "@/components/FilterDatePicker";
import { SiteDataGrid } from "@/components/SiteDataGrid";
import { Button } from "@/components/ui/button";
import { Route as rootRoute } from "@/routes/__root";
import { siteService } from "@/services/siteService";

const unbilledSearchSchema = z.object({
  date: z
    .string()
    .default(() =>
      format(lastDayOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"),
    ),
});

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sites/unbilled",
  component: RouteComponent,
  validateSearch: (search) => unbilledSearchSchema.parse(search),
});

type SiteFiltersState = {
  contractor_name: string;
  mobile_no: string;
  address: string;
};

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const dateParam = search.date;

  // Local text filters (client-side filtering)
  const [localFilters, setLocalFilters] = useState<SiteFiltersState>({
    contractor_name: "",
    mobile_no: "",
    address: "",
  });

  // --- Queries ---

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["sites", "unbilled", dateParam],
    queryFn: () => siteService.unbilled(dateParam),
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
    setLocalFilters({ contractor_name: "", address: "", mobile_no: "" });
  };

  // --- Client-side filtering ---
  const filteredData = (data || []).filter((site) => {
    const nameMatch = site.contractor_name
      .toLowerCase()
      .includes(localFilters.contractor_name.toLowerCase());
    const mobileMatch = site.mobile_no
      .toLowerCase()
      .includes(localFilters.mobile_no.toLowerCase());
    const addressMatch = site.address
      .toLowerCase()
      .includes(localFilters.address.toLowerCase());
    return nameMatch && mobileMatch && addressMatch;
  });

  return (
    <div className="flex-1 space-y-6 px-2 py-6 sm:p-6 md:p-8 md:pt-6 animate-in fade-in duration-500 overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center justify-between pb-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Unbilled Sites
            <div className="h-6 w-px bg-zinc-800 ml-2 hidden sm:block" />
            <span className="text-sm font-medium text-zinc-500 hidden sm:block mt-1">
              Outstanding
            </span>
          </h2>
          <p className="text-zinc-400">
            View all sites that have unbilled records pending in the system.
          </p>
        </div>
        <Button
          variant="outline"
          asChild
          className="border-zinc-700 bg-zinc-950/50 hover:bg-zinc-900 text-zinc-300 shadow-[0_0_20px_-5px_rgba(39,39,42,0.3)] transition-all font-medium cursor-pointer"
        >
          <Link to="/sites">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
          </Link>
        </Button>
      </div>

      <div className="h-px w-full bg-linear-to-r from-zinc-800 to-transparent" />

      {/* Date Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60 shadow-lg backdrop-blur-xl">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <span className="text-sm font-semibold text-zinc-300">
            As of Date
          </span>
          <span className="text-xs text-zinc-500">
            Show sites with unbilled records on or before this date
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-60">
            <FilterDatePicker
              placeholder="All Dates"
              value={
                dateParam
                  ? format(
                      parse(dateParam, "yyyy-MM-dd", new Date()),
                      "dd-MM-yyyy",
                    )
                  : ""
              }
              onChange={(newDateStr) => {
                if (newDateStr) {
                  const parsedDate = parse(
                    newDateStr,
                    "dd-MM-yyyy",
                    new Date(),
                  );
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      date: format(parsedDate, "yyyy-MM-dd"),
                    }),
                    replace: true,
                  });
                } else {
                  navigate({
                    search: (prev) => ({ ...prev, date: "" }),
                    replace: true,
                  });
                }
              }}
            />
          </div>
          {dateParam && (
            <Button
              variant="ghost"
              onClick={() =>
                navigate({
                  search: (prev) => ({ ...prev, date: "" }),
                  replace: true,
                })
              }
              className="w-full sm:w-auto text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-300 border border-rose-500/20 rounded-xl px-3 h-10 cursor-pointer"
            >
              Clear Date
            </Button>
          )}
        </div>
      </div>

      {isError && error && <ErrorAlert error={error} />}

      <SiteDataGrid
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
