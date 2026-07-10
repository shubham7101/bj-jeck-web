import { useStore } from "@tanstack/react-form";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createRoute, Link, useNavigate } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import { format, isValid, parse } from "date-fns";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  IndianRupee,
  Loader2,
  Plus,
  Receipt,
  Save,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { SiteDataGrid } from "@/components/SiteDataGrid";
import { FormBase } from "@/components/form/FormBase";
import { useAppForm } from "@/components/form/hooks";
import { SuccessFeedback } from "@/components/SuccessFeedback";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { Site } from "@/schemas/siteSchema";
import { type CreateLedger, createLedgerSchema } from "@/schemas/ledgerSchema";
import { siteService } from "@/services/siteService";
import { ledgerService } from "@/services/ledgerService";
import { formatCurrency, formatDate, getInitials } from "@/utils";

// --- Route Definition ---

const ledgerSearchSchema = z.object({
  site_id: z.number().optional(),
});

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ledger/new",
  component: NewLedgerPage,
  validateSearch: (search) => ledgerSearchSchema.parse(search),
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
  pendingComponent: LedgerLoadingSkeleton,
});

// --- Schemas & Constants ---

const DATE_FORMAT = "dd-MM-yyyy";

const DEFAULT_FORM_VALUES: Partial<CreateLedger> = {
  site_id: 0,
  amount: 0,
  date: format(new Date(), DATE_FORMAT),
  notes: "",
  type: "payment",
};

// --- Main Component ---

export default function NewLedgerPage() {
  const navigate = useNavigate();
  const { site } = Route.useLoaderData();
  const [createdEntry, setCreatedEntry] = useState<any | null>(null);

  // 1. Add a key state to control the form instance
  const [formKey, setFormKey] = useState(0);

  const successRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to success message
  useEffect(() => {
    if (createdEntry && successRef.current) {
      setTimeout(() => {
        successRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [createdEntry]);

  const handleSiteSelect = (selected: Site) => {
    navigate({
      to: "/ledger/new",
      search: { site_id: selected.id },
    });
  };

  const handleChangeSite = () => {
    setCreatedEntry(null);
    setFormKey(0); // Reset key when changing site
    navigate({
      to: "/ledger/new",
      search: { site_id: undefined },
    });
  };

  // 2. Logic to handle "Add Another"
  const handleAddAnother = () => {
    setCreatedEntry(null); // Hide success message
    setFormKey((prev) => prev + 1); // Change key to unmount/remount form with default values
  };

  return (
    <div className="flex-1 w-full max-w-[100vw] lg:max-w-6xl lg:mx-auto px-2 py-6 sm:p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24 overflow-x-hidden min-w-0">
      <Header
        step={site ? 2 : 1}
        hasSite={!!site}
        onChangeSite={handleChangeSite}
      />

      {!site ? (
        <SiteSelectionStep onSelect={handleSiteSelect} />
      ) : (
        <LedgerEntryForm
          key={formKey} // 3. Pass the key here
          site={site}
          onSuccess={setCreatedEntry}
          onReset={() => setCreatedEntry(null)}
          onChangeSite={handleChangeSite}
        />
      )}

      {createdEntry && (
        <div ref={successRef}>
          <SuccessFeedback
            title="Payment Recorded"
            description="The ledger has been updated successfully."
            details={[
              {
                label: "Amount Received",
                value: (
                  <span className="flex items-center text-2xl font-bold text-emerald-400">
                    <IndianRupee className="mr-1 h-5 w-5" />
                    {formatCurrency(createdEntry.amount || 0)}
                  </span>
                ),
              },
              {
                label: "Transaction Date",
                value: (
                  <span className="text-lg font-medium text-emerald-100">
                    {formatDate(createdEntry.date)}
                  </span>
                ),
              },
            ]}
            primaryAction={{
              to: "/ledger",
              label: "View Ledger",
              icon: Receipt,
            }}
            secondaryAction={{
              onClick: handleAddAnother,
              label: "Add Another",
              icon: Plus,
            }}
            onDismiss={() => setCreatedEntry(null)}
          />
        </div>
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
          New Payment
        </h2>
        <p className="text-zinc-400">
          {step === 1 ? "Step 1: Select Site" : "Step 2: Payment Details"}
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
          <Link to="/ledger">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ledger
          </Link>
        </Button>
      </div>
    </div>
  );
}

// --- Step 1: Customer Selection (Reused) ---

function SiteSelectionStep({
  onSelect,
}: {
  onSelect: (c: Site) => void;
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
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

  const mockNavigate = (options: any) => {
    if (typeof options.search === "function") {
      const currentParams = { page, per_page: perPage };
      const newParams = options.search(currentParams);
      if (newParams.page !== undefined) setPage(newParams.page);
      if (newParams.per_page !== undefined) setPerPage(newParams.per_page);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-zinc-100">Find Site</h3>
        <p className="text-zinc-400">
          Select the site for this transaction.
        </p>
      </div>
      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl animate-in fade-in duration-500 relative overflow-hidden min-w-0">
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

// --- Step 2: Form ---

function LedgerEntryForm({
  site,
  onSuccess,
  onReset,
  onChangeSite,
}: {
  site: Site;
  onSuccess: (data: any) => void;
  onReset: () => void;
  onChangeSite: () => void;
}) {
  const queryClient = useQueryClient();

  // const { data: stats } = useQuery({
  //   queryKey: ["sites", site.id, "stats"],
  //   queryFn: () => siteService.stats(site.id),
  // });
  const stats: any = null;

  const billed = stats?.bills?.total_bill_amount ?? 0;
  const paid = stats?.ledger?.total_paid ?? 0;
  const balance = billed - paid;

  const mutation = useMutation({
    mutationFn: (data: CreateLedger) => ledgerService.create(data),
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["sites", site.id] });
    },
  });

  const form = useAppForm({
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      site_id: site.id,
    } as CreateLedger,
    validators: {
      onSubmit: createLedgerSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });

  const formValues = useStore(form.store, (state: any) => state.values);

  const handleResetForm = () => {
    form.reset({
      ...DEFAULT_FORM_VALUES,
      site_id: site.id,
    } as CreateLedger);
    onReset();
    mutation.reset();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="animate-in slide-in-from-right-4 duration-300"
    >
      <form.Field name="site_id">
        {(field) => (
          <input type="hidden" name={field.name} value={field.state.value} />
        )}
      </form.Field>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-w-0">
        {/* Left Column: Input Form fields */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          {/* Site Header Info */}
          <div className="flex items-center justify-between bg-card/60 border border-border/80 p-4 rounded-xl shadow-md backdrop-blur-md min-w-0">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className="h-10 w-10 border border-border shrink-0">
                <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                  {getInitials(site.contractor_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground hover:underline truncate">
                    <Link
                      to="/sites/$siteId"
                      params={{ siteId: site.id.toString() }}
                    >
                      {site.contractor_name}
                    </Link>
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  ID: #{site.id} • {site.mobile_no}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <Badge
                variant="outline"
                className={cn(
                  "hidden sm:flex pl-1.5 pr-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wider uppercase",
                  site.active
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground border-border",
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 h-1.5 w-1.5 rounded-full",
                    site.active
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-muted-foreground",
                  )}
                />
                {site.active ? "Active" : "Inactive"}
              </Badge>
              <Button
                type="button"
                variant="outline"
                onClick={onChangeSite}
                className="sm:hidden w-full cursor-pointer border-border hover:bg-muted text-foreground text-xs h-9 px-3"
              >
                <User className="mr-1.5 h-3.5 w-3.5" /> Change
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onChangeSite}
                className="hidden sm:flex cursor-pointer border-border hover:bg-muted text-foreground h-10 px-4"
              >
                <User className="mr-2 h-4 w-4" /> Change Site
              </Button>
            </div>
          </div>

          {mutation.isError && <ErrorAlert error={mutation.error} />}

          <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl animate-in fade-in duration-500 relative overflow-hidden min-w-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-emerald-500 to-emerald-400/50" />
            <CardHeader className="pb-4 border-b border-zinc-800/50 bg-zinc-900/30">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-450" />
                Transaction Details
              </CardTitle>
              <CardDescription>
                Record a cash or bank payment received from the customer.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Transaction Type */}
                <form.Field name="type">
                  {(field) => (
                    <FormBase field={field} label="Transaction Type">
                      <Select
                        value={field.state.value}
                        onValueChange={(val: any) => field.handleChange(val)}
                      >
                        <SelectTrigger className="w-full h-14 bg-zinc-950/50 border-zinc-800 text-zinc-200 focus:border-emerald-500/50 focus:ring-emerald-500/50 transition-all">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="refund">Refund</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-zinc-500 mt-1.5 ml-1">
                        Select the type of transaction.
                      </p>
                    </FormBase>
                  )}
                </form.Field>

                {/* Amount Field - Highlighted */}
                <form.Field name="amount">
                  {(field) => (
                    <FormBase field={field} label="Payment Amount">
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xl pointer-events-none group-focus-within:text-emerald-400">
                          ₹
                        </span>
                        <Input
                          id={field.name}
                          type="number"
                          placeholder="0.00"
                          className="pl-10 h-14 bg-zinc-950/50 border-emerald-500/30 ring-emerald-500/50 focus:border-emerald-500/50 text-2xl font-bold text-white placeholder:text-zinc-700 transition-all shadow-[0_0_15px_-3px_rgba(16,185,129,0.05)]"
                          value={
                            field.state.value === 0 ? "" : field.state.value
                          }
                          onBlur={field.handleBlur}
                          onChange={(e) =>
                            field.handleChange(
                              e.target.value ? parseFloat(e.target.value) : 0,
                            )
                          }
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1.5 ml-1">
                        Enter the exact monetary value received.
                      </p>
                    </FormBase>
                  )}
                </form.Field>

                {/* Date Field */}
                <form.Field name="date">
                  {(field) => {
                    const dateValue =
                      field.state.value &&
                      isValid(parse(field.state.value, DATE_FORMAT, new Date()))
                        ? parse(field.state.value, DATE_FORMAT, new Date())
                        : undefined;

                    return (
                      <FormBase field={field} label="Transaction Date">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-14 pl-4 text-left font-normal bg-zinc-950/50 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all",
                                !dateValue && "text-muted-foreground",
                              )}
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                                  Selected Date
                                </span>
                                <span className="text-base text-zinc-200">
                                  {dateValue
                                    ? format(dateValue, "dd MMMM yyyy")
                                    : "Pick a date"}
                                </span>
                              </div>
                              <CalendarIcon className="ml-auto h-5 w-5 opacity-50 text-zinc-400" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0 bg-zinc-950 border-zinc-850"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={dateValue}
                              onSelect={(date) => {
                                const dateStr = date
                                  ? format(date, DATE_FORMAT)
                                  : "";
                                field.handleChange(dateStr);
                              }}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              autoFocus
                              className="bg-zinc-950 text-zinc-200 rounded-md border-zinc-850"
                            />
                          </PopoverContent>
                        </Popover>
                      </FormBase>
                    );
                  }}
                </form.Field>
              </div>

              {/* Notes / Reference Details Field */}
              <form.Field name="notes">
                {(field) => (
                  <FormBase field={field} label="Payment Notes / Reference">
                    <div className="relative">
                      <textarea
                        id={field.name}
                        placeholder="e.g. Google Pay reference, Cheque number, Paid in cash, Part payment details..."
                        className="w-full min-h-[96px] bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                        value={field.state.value || ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 ml-1">
                      Add any payment reference, bank details, or operator
                      remarks.
                    </p>
                  </FormBase>
                )}
              </form.Field>
            </CardContent>

            <CardFooter className="bg-zinc-900/30 border-t border-zinc-800/50 p-6 flex justify-end gap-4 rounded-b-xl">
              <Button
                variant="ghost"
                type="button"
                onClick={handleResetForm}
                disabled={mutation.isPending}
                className="hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Reset
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={mutation.isPending}
                className="min-w-48 bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-lg shadow-emerald-900/20 cursor-pointer transition-all"
              >
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                {mutation.isPending ? "Saving..." : "Save Payment"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Dynamic Live Receipt Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-4 min-w-0">
          <div className="flex items-center gap-2 ml-1">
            <Sparkles className="h-4 w-4 text-emerald-450 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Live Receipt Preview
            </span>
          </div>

          <div className="relative group overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-2xl flex flex-col min-h-[380px] justify-between">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-550/10 transition-all duration-500" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />

            {/* Receipt Content */}
            <div className="space-y-6 z-10">
              {/* Header Branding */}
              <div className="flex justify-between items-start border-b border-dashed border-zinc-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-300 tracking-wider">
                    JACK RENTAL SERVICE
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Rentals & Inventory Ledger
                  </p>
                </div>
                <Badge className="bg-emerald-950/80 border-emerald-550/30 text-emerald-400 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-sm">
                  Draft Receipt
                </Badge>
              </div>

              {/* Site Segment */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">
                  Received From
                </span>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                    {getInitials(site.contractor_name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      {site.contractor_name}
                    </p>
                    <p className="text-[10px] text-zinc-550">
                      ID: #{site.id} • {site.mobile_no}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transaction Date Segment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">
                    Date Created
                  </span>
                  <span className="text-xs font-medium text-zinc-300 mt-1 block">
                    {formValues.date
                      ? (() => {
                          const dateObj = parse(
                            formValues.date,
                            DATE_FORMAT,
                            new Date(),
                          );
                          return isValid(dateObj)
                            ? format(dateObj, "do MMMM yyyy")
                            : formValues.date;
                        })()
                      : format(new Date(), "do MMMM yyyy")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">
                    Transaction Type
                  </span>
                  <span className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {formValues.type?.charAt(0).toUpperCase()}
                    {formValues.type?.slice(1)}
                  </span>
                </div>
              </div>

              {/* Account Summary Segment */}
              <div className="bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-800/80 grid grid-cols-2 gap-y-2 gap-x-4">
                <div className="col-span-2 border-b border-zinc-800/60 pb-1.5 mb-0.5 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    Ledger Account Summary
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase">
                    Live Metrics
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest block">
                    Total Billed
                  </span>
                  <span className="text-xs font-bold text-zinc-350 mt-0.5 block">
                    ₹{formatCurrency(billed)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest block">
                    Outstanding
                  </span>
                  <span
                    className={cn(
                      "text-xs font-bold mt-0.5 block",
                      balance > 0 ? "text-rose-400" : "text-emerald-400",
                    )}
                  >
                    ₹{formatCurrency(balance)}
                  </span>
                </div>
                <div className="col-span-2 border-t border-zinc-800/60 pt-2 mt-1.5 flex justify-between items-baseline">
                  <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest block">
                    New Outstanding (Est.)
                  </span>
                  <span
                    className={cn(
                      "text-sm font-black tracking-tight tabular-nums",
                      balance - (formValues.amount || 0) > 0
                        ? "text-rose-400"
                        : "text-emerald-400",
                    )}
                  >
                    ₹{formatCurrency(balance - (formValues.amount || 0))}
                  </span>
                </div>
              </div>

              {/* Remarks / Reference Segment */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">
                  Remarks / References
                </span>
                {formValues.notes ? (
                  <p className="text-xs text-zinc-350 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-900/60 leading-relaxed wrap-break-word max-h-[80px] overflow-auto">
                    {formValues.notes}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-600 italic">
                    No payment notes or reference added.
                  </p>
                )}
              </div>
            </div>

            {/* Total Paid Block (Styled Vintage Ticket Cutout bottom) */}
            <div className="border-t border-dashed border-zinc-800 pt-6 mt-6 z-10">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-bold text-zinc-400 tracking-wider">
                  TOTAL VALUE
                </span>
                <span className="text-3xl font-black text-emerald-400 tracking-tight tabular-nums">
                  ₹{formatCurrency(formValues.amount || 0)}
                </span>
              </div>

              {/* Barcode effect */}
              <div className="w-full flex items-center justify-between opacity-35 hover:opacity-50 transition-opacity mt-4 select-none">
                <div className="h-6 w-[2px] bg-zinc-450" />
                <div className="h-6 w-px bg-zinc-450" />
                <div className="h-6 w-[4px] bg-zinc-450" />
                <div className="h-6 w-px bg-zinc-450" />
                <div className="h-6 w-[2px] bg-zinc-450" />
                <div className="h-6 w-px bg-zinc-450" />
                <div className="h-6 w-[3px] bg-zinc-450" />
                <div className="h-6 w-px bg-zinc-450" />
                <div className="h-6 w-[5px] bg-zinc-450" />
                <div className="h-6 w-[2px] bg-zinc-450" />
                <div className="h-6 w-px bg-zinc-450" />
                <div className="h-6 w-[3px] bg-zinc-450" />
                <div className="h-6 w-px bg-zinc-450" />
                <div className="h-6 w-[4px] bg-zinc-450" />
                <div className="h-6 w-[2px] bg-zinc-450" />
                <div className="h-6 w-px bg-zinc-450" />
                <div className="h-6 w-[3px] bg-zinc-450" />
                <div className="h-6 w-px bg-zinc-450" />
                <div className="h-6 w-[5px] bg-zinc-450" />
                <div className="h-6 w-[2px] bg-zinc-450" />
                <div className="h-6 w-px bg-zinc-450" />
                <div className="h-6 w-[2px] bg-zinc-450" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// --- Skeleton ---

function LedgerLoadingSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-zinc-800" />
          <Skeleton className="h-4 w-32 bg-zinc-800/60" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32 bg-zinc-800 hidden sm:block" />
        </div>
      </div>
      <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-full bg-zinc-800" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-zinc-800" />
            <Skeleton className="h-3 w-48 bg-zinc-800/60" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full bg-zinc-800" />
      </div>
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-40 bg-zinc-800" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-14 w-full bg-zinc-800" />
            <Skeleton className="h-14 w-full bg-zinc-800" />
          </div>
        </CardContent>
        <CardFooter className="bg-zinc-950/30 p-6 flex justify-end gap-4">
          <Skeleton className="h-10 w-20 bg-zinc-800" />
          <Skeleton className="h-10 w-32 bg-zinc-800" />
        </CardFooter>
      </Card>
    </div>
  );
}
