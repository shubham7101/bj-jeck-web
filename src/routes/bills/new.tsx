import { useForm, useStore } from "@tanstack/react-form";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  format,
  isAfter,
  isValid,
  parse,
  parseISO,
  startOfDay,
} from "date-fns";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Hash,
  Loader2,
  Package,
  Plus,
  Receipt,
  Save,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { ErrorAlert } from "@/components/ErrorAlert";
import { FilterDatePicker } from "@/components/FilterDatePicker";
import { RecordTable } from "@/components/RecordDataGrid";
import { SiteDataGrid } from "@/components/SiteDataGrid";
import { SuccessFeedback } from "@/components/SuccessFeedback";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Route as rootRoute } from "@/routes/__root";
import type { Site } from "@/schemas/siteSchema";
import { billService } from "@/services/billService";
import { recordService } from "@/services/recordService";
import { siteService } from "@/services/siteService";
import { formatCurrency, getInitials } from "@/utils";

const DATE_FORMAT = "dd-MM-yyyy";

function parseDateSafe(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  let parsed = parseISO(dateStr);
  if (isValid(parsed)) return startOfDay(parsed);
  parsed = parse(dateStr, DATE_FORMAT, new Date());
  if (isValid(parsed)) return startOfDay(parsed);
  return null;
}

// --- Route Definition ---

const billSearchSchema = z.object({
  site_id: z.number().optional(),
});

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bills/new",
  component: NewBillPage,
  validateSearch: (search) => billSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ site_id: search.site_id }),
  loader: async ({ deps: { site_id } }) => {
    if (!site_id) return { site: null };
    try {
      const site = await siteService.get(site_id);
      return { site };
    } catch (_e) {
      return { site: null };
    }
  },
  pendingComponent: BillLoadingSkeleton,
});

// --- Main Component ---

export default function NewBillPage() {
  const navigate = useNavigate();
  const { site } = Route.useLoaderData();

  const handleSiteSelect = (selected: Site) => {
    navigate({
      to: "/bills/new",
      search: { site_id: selected.id },
    });
  };

  const handleChangeSite = () => {
    navigate({
      to: "/bills/new",
      search: { site_id: undefined },
    });
  };

  return (
    <div className="flex-1 w-full max-w-[100vw] lg:max-w-6xl lg:mx-auto px-2 py-4 sm:py-6 sm:p-6 md:p-8 space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24 overflow-x-hidden min-w-0">
      <Header
        step={site ? 2 : 1}
        hasSite={!!site}
        onChangeSite={handleChangeSite}
      />

      {!site ? (
        <SiteSelectionStep onSelect={handleSiteSelect} />
      ) : (
        <BillEntryForm site={site} />
      )}
    </div>
  );
}

function Header({
  step,
  hasSite,
  onChangeSite,
}: {
  step: number;
  hasSite: boolean;
  onChangeSite: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Create New Bill
        </h2>
        <p className="text-zinc-400">
          {step === 1 ? "Step 1: Select a Site" : "Step 2: Bill Details"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {hasSite && (
          <Button
            variant="outline"
            onClick={onChangeSite}
            className="hidden sm:flex cursor-pointer border-zinc-700 bg-zinc-950/50 hover:bg-zinc-800 text-zinc-300"
          >
            <User className="mr-2 h-4 w-4" /> Change Site
          </Button>
        )}
        <Button
          variant="ghost"
          asChild
          className="hidden sm:flex hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
        >
          <Link to="/bills">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Link>
        </Button>
      </div>
    </div>
  );
}

// --- Step 1: Customer Selection ---

function SiteSelectionStep({ onSelect }: { onSelect: (c: Site) => void }) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filters, setFilters] = useState({
    contractor_name: "",
    mobile_no: "",
    address: "",
  });

  const debouncedFilters = useDebounce(filters, 500);

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["sites", "select", { page, perPage, ...debouncedFilters }],
    queryFn: () =>
      siteService.search({
        page,
        per_page: perPage,
        contractor_name: debouncedFilters.contractor_name || undefined,
        mobile_no: debouncedFilters.mobile_no || undefined,
        address: debouncedFilters.address || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters({ contractor_name: "", mobile_no: "", address: "" });
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-zinc-100">Find Site</h3>
        <p className="text-zinc-400">
          Search for an existing site to generate a bill for.
        </p>
      </div>
      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl relative overflow-hidden min-w-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-emerald-500 to-emerald-400/50" />
        <CardContent className="p-2 sm:p-6 pt-4 sm:pt-6 min-w-0">
          <div className="min-w-0 w-full">
            <SiteDataGrid
              data={data?.data || []}
              isLoading={isLoading}
              isPlaceholderData={isPlaceholderData}
              filterProps={{
                filters: filters,
                onChange: handleFilterChange,
                onReset: handleReset,
              }}
              paginationProps={{
                currentPage: page,
                totalPages: data?.pagination.total_pages || 0,
                perPage: perPage,
                totalCount: data?.pagination.total_count || 0,
                onPageChange: setPage,
                onPerPageChange: setPerPage,
              }}
              onSelect={onSelect}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Step 2: Bill Entry ---

function BillEntryForm({ site }: { site: Site }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [_maxToDate, setMaxToDate] = useState<Date | null>(null);
  const [successBill, setSuccessBill] = useState<any | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Bill Params Mutation (Fetch initial dates)
  const billParamsMutation = useMutation({
    mutationFn: (siteId: number) => billService.billParams(siteId),
    onSuccess: (data) => {
      const safeFromDate = parseDateSafe(data.from_date);
      const safeToDate = parseDateSafe(data.to_date);

      form.setFieldValue(
        "from_date",
        safeFromDate ? format(safeFromDate, DATE_FORMAT) : "",
      );

      setMaxToDate(safeToDate);

      form.setFieldValue(
        "to_date",
        safeToDate ? format(safeToDate, DATE_FORMAT) : "",
      );
    },
  });

  // Create Bill Mutation
  const createBillMutation = useMutation({
    mutationFn: (payload: any) => billService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({
        queryKey: ["records", site.id],
      });
      setSuccessBill(data);
    },
  });

  // Load params on mount
  useEffect(() => {
    if (site.id && !successBill) {
      billParamsMutation.mutate(site.id);
    }
  }, [site.id, successBill, billParamsMutation.mutate]);

  // Scroll to success message
  useEffect(() => {
    if (successBill && successRef.current) {
      const timer = setTimeout(() => {
        successRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [successBill]);

  // Form Setup
  const form = useForm({
    defaultValues: {
      bill_id: "" as number | "",
      site_id: site.id,
      from_date: "",
      to_date: "",
      khata_no: "",
    },
    onSubmit: async ({ value }) => {
      createBillMutation.mutate({
        id: Number(value.bill_id),
        site_id: value.site_id,
        from_date: value.from_date,
        to_date: value.to_date,
        khata_no: value.khata_no,
      });
    },
  });

  // Handle "Create Another"
  const handleReset = () => {
    setSuccessBill(null);
    form.reset();
    form.setFieldValue("site_id", site.id);
    // Fetch fresh params for the next bill
    billParamsMutation.mutate(site.id);
  };

  // Logic for Record Preview Table
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);

  const fromDateVal = useStore(form.store, (state) => state.values.from_date);
  const toDateVal = useStore(form.store, (state) => state.values.to_date);

  const parsedFrom = parseDateSafe(fromDateVal);
  const parsedTo = parseDateSafe(toDateVal);
  const enableRecordQuery = !!parsedFrom && !!parsedTo && !successBill;

  const { data: recordsData, isLoading: isRecordsLoading } = useQuery({
    queryKey: [
      "records",
      "bill-preview",
      site.id,
      fromDateVal,
      toDateVal,
      page,
      perPage,
    ],
    queryFn: () =>
      recordService.search({
        site_id: site.id,
        from_date: fromDateVal,
        to_date: toDateVal,
        page,
        per_page: perPage,
      }),
    enabled: enableRecordQuery,
  });

  // Manual Filter
  const filteredRecords =
    recordsData?.data.filter((record) => !record.bill_id) || [];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-right-4 duration-300">
      {/* Site Header Info */}
      <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-9 w-9 border border-zinc-800">
            <AvatarFallback className="bg-zinc-800 text-xs text-zinc-300">
              {getInitials(site.contractor_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100 hover:underline">
              <Link to="/sites/$siteId" params={{ siteId: site.id.toString() }}>
                {site.contractor_name}
              </Link>
            </h4>
            <p className="text-xs text-zinc-400">
              ID: #{site.id} • {site.mobile_no}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "pl-2 pr-2.5 py-1 rounded-full border",
            site.active
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-zinc-800 text-zinc-400 border-zinc-700",
          )}
        >
          {site.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="space-y-2">
        {(billParamsMutation.isError || createBillMutation.isError) && (
          <ErrorAlert
            error={billParamsMutation.error || createBillMutation.error}
          />
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4 sm:space-y-6"
      >
        <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl relative overflow-hidden min-w-0">
          <CardHeader className="border-b">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Hash className="h-4 w-4 text-emerald-500" />
              Bill Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:px-6 sm:pt-6 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-start min-w-0">
              {/* Bill ID */}
              <form.Field name="bill_id">
                {(field) => {
                  const hasError = field.state.meta.errors.length > 0;
                  return (
                    <div className="flex flex-col gap-1.5 group mb-5">
                      <label className="text-sm font-semibold text-zinc-300">
                        Bill ID
                      </label>
                      <div className="relative">
                        <Hash
                          className={cn(
                            "absolute left-2.5 top-3 h-4 w-4 transition-colors",
                            hasError
                              ? "text-rose-500"
                              : "text-zinc-500 group-focus-within:text-emerald-500",
                          )}
                        />
                        <Input
                          id={field.name}
                          type="number"
                          placeholder="e.g. 101"
                          className={cn(
                            "pl-9 bg-zinc-950/50 border-zinc-700 font-bold text-lg transition-colors",
                            hasError
                              ? "border-rose-500/50 focus:ring-rose-500/50 focus:border-rose-500/50"
                              : "focus:ring-emerald-500/50 focus:border-emerald-500/50",
                          )}
                          value={field.state.value || ""}
                          onBlur={field.handleBlur}
                          onChange={(e) =>
                            field.handleChange(
                              e.target.value ? Number(e.target.value) : "",
                            )
                          }
                          autoFocus
                          disabled={!!successBill}
                        />
                      </div>
                      {hasError && (
                        <span className="text-xs font-medium text-rose-500 animate-in slide-in-from-top-1">
                          {field.state.meta.errors
                            .map((e: any) => e.message || e)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  );
                }}
              </form.Field>

              {/* From Date (Read Only) */}
              <form.Field name="from_date">
                {(field) => {
                  const hasError = field.state.meta.errors.length > 0;
                  return (
                    <div className="flex flex-col gap-1.5 group mb-5">
                      <label className="text-sm font-semibold text-zinc-300">
                        From Date (Fixed)
                      </label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                        <div className="h-10 pl-9 py-2 rounded-md border border-zinc-800 bg-zinc-950/30 text-zinc-400 text-sm flex items-center cursor-not-allowed shadow-inner backdrop-blur-sm">
                          {billParamsMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            field.state.value || "Loading..."
                          )}
                        </div>
                      </div>
                      {hasError && (
                        <span className="text-xs font-medium text-rose-500 animate-in slide-in-from-top-1">
                          {field.state.meta.errors
                            .map((e: any) => e.message || e)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  );
                }}
              </form.Field>

              {/* To Date (Interactive) */}
              <form.Field
                name="to_date"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return "To Date is required";
                    const current = parseDateSafe(value);
                    if (!current) return "Invalid date";
                    if (parsedFrom && !isAfter(current, parsedFrom)) {
                      return "Must be after From Date";
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => {
                  const hasError = field.state.meta.errors.length > 0;
                  return (
                    <div className="flex flex-col gap-1.5 group mb-5">
                      <label className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
                        To Date <span className="text-rose-500">*</span>
                      </label>
                      <FilterDatePicker
                        value={field.state.value}
                        min={
                          parsedFrom
                            ? format(parsedFrom, "yyyy-MM-dd")
                            : undefined
                        }
                        max={format(new Date(), "yyyy-MM-dd")}
                        onChange={(val) => field.handleChange(val)}
                        disabled={
                          !parsedFrom ||
                          billParamsMutation.isPending ||
                          !!successBill
                        }
                      />
                      {hasError && (
                        <span className="text-xs font-medium text-rose-500 animate-in slide-in-from-top-1">
                          {field.state.meta.errors
                            .map((e: any) => e.message || e)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  );
                }}
              </form.Field>

              {/* Khata No */}
              <form.Field name="khata_no">
                {(field) => {
                  const hasError = field.state.meta.errors.length > 0;
                  return (
                    <div className="flex flex-col gap-1.5 group mb-5">
                      <label className="text-sm font-semibold text-zinc-300">
                        Khata No (Optional)
                      </label>
                      <Input
                        id={field.name}
                        placeholder="e.g. 3 12"
                        className={cn(
                          "bg-zinc-950/50 border-zinc-700 transition-colors",
                          hasError
                            ? "border-rose-500/50 focus:ring-rose-500/50 focus:border-rose-500/50"
                            : "focus:ring-emerald-500/50 focus:border-emerald-500/50",
                        )}
                        value={field.state.value || ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={!!successBill}
                      />
                      {hasError && (
                        <span className="text-xs font-medium text-rose-500 animate-in slide-in-from-top-1">
                          {field.state.meta.errors
                            .map((e: any) => e.message || e)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  );
                }}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Records Preview Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-zinc-400" />
            Included Unbilled Records
            <Badge
              variant="secondary"
              className="bg-zinc-800 text-zinc-400 ml-2"
            >
              {filteredRecords.length} visible
            </Badge>
          </h3>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm shadow-xl overflow-hidden min-w-0 w-full">
            <RecordTable data={filteredRecords} isLoading={isRecordsLoading} />

            {recordsData && recordsData.pagination.total_pages > 1 && (
              <div className="p-2 border-t border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-zinc-400 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <span className="text-xs text-zinc-500 font-medium">
                  Page {page} of {recordsData.pagination.total_pages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(recordsData.pagination.total_pages, p + 1),
                    )
                  }
                  disabled={page >= recordsData.pagination.total_pages}
                  className="text-zinc-400 hover:text-white"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
          {filteredRecords.length === 0 &&
            recordsData &&
            recordsData.data.length > 0 && (
              <div className="text-xs text-amber-500 text-center">
                All records on this page are already billed. Check other pages.
              </div>
            )}
        </div>

        {/* Footer / Submit Section */}
        <div className="flex justify-end gap-4 pt-4 border-t border-zinc-800/50">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmittingForm]) => (
              <Button
                type="submit"
                size="lg"
                disabled={
                  !canSubmit ||
                  createBillMutation.isPending ||
                  isSubmittingForm ||
                  !toDateVal ||
                  !parsedFrom ||
                  !!successBill // Disable button if bill is already created
                }
                className={cn(
                  "min-w-40 border-none shadow-lg transition-all duration-300",
                  successBill
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20",
                )}
              >
                {createBillMutation.isPending || isSubmittingForm ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                    Creating...
                  </>
                ) : successBill ? (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" /> Bill Created
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" /> Generate Bill
                  </>
                )}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>

      {/* Success Feedback Appended at Bottom */}
      {successBill && (
        <div ref={successRef}>
          <SuccessFeedback
            title="Bill Generated Successfully"
            description={
              <>
                Invoice{" "}
                <span className="font-mono font-medium text-emerald-300 ml-1">
                  #{successBill.id}
                </span>{" "}
                has been created and saved.
              </>
            }
            details={[
              {
                label: "Billing Period",
                value: (
                  <span className="flex items-center gap-1">
                    {format(new Date(successBill.from_date), "dd MMM")} -{" "}
                    {format(new Date(successBill.to_date), "dd MMM yyyy")}
                  </span>
                ),
              },
              {
                label: "Khata No",
                value: (
                  <span className="font-mono">
                    {successBill.khata_no || "N/A"}
                  </span>
                ),
              },
              {
                label: "Total Amount",
                value: (
                  <span className="flex items-center text-emerald-400 font-bold text-lg">
                    {formatCurrency(successBill.total || 0)}
                  </span>
                ),
              },
            ]}
            primaryAction={{
              to: "/bills/$billId",
              params: { billId: successBill.id.toString() },
              label: "View Bill Details",
              icon: Receipt,
            }}
            secondaryAction={{
              onClick: handleReset,
              label: "Add Another Bill",
              icon: Plus,
            }}
            onDismiss={() => navigate({ to: "/bills" })}
          />
        </div>
      )}
    </div>
  );
}

function BillLoadingSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-zinc-800" />
          <Skeleton className="h-4 w-32 bg-zinc-800/60" />
        </div>
        <Skeleton className="h-10 w-32 bg-zinc-800" />
      </div>
      <div className="flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 p-4 rounded-lg">
        <Skeleton className="h-9 w-9 rounded-full bg-zinc-800" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-zinc-800" />
          <Skeleton className="h-3 w-48 bg-zinc-800/60" />
        </div>
      </div>
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <Skeleton className="h-5 w-40 bg-zinc-800" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-16 bg-zinc-800/60" />
              <Skeleton className="h-10 w-full bg-zinc-800" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
