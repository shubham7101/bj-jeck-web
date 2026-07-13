import { useForm, useStore } from "@tanstack/react-form";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createRoute, Link, useNavigate } from "@tanstack/react-router";
import { format, isValid, parse } from "date-fns";
import {
  ArrowLeft,
  Check,
  IndianRupee,
  Loader2,
  Plus,
  Receipt,
  Save,
  SkipForward,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { CustomerDataGrid } from "@/components/CustomerDataGrid";
import { ErrorAlert } from "@/components/ErrorAlert";
import { FilterDatePicker } from "@/components/FilterDatePicker";
import { SiteDataGrid } from "@/components/SiteDataGrid";
import { SuccessFeedback } from "@/components/SuccessFeedback";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Route as rootRoute } from "@/routes/__root";
import type { Customer } from "@/schemas/customerSchema";
import { type CreateLedger, createLedgerSchema } from "@/schemas/ledgerSchema";
import type { Site } from "@/schemas/siteSchema";
import { customerService } from "@/services/customerService";
import { ledgerService } from "@/services/ledgerService";
import { siteService } from "@/services/siteService";
import { formatCurrency, formatDate, getInitials } from "@/utils";

// --- Route Definition ---

const ledgerSearchSchema = z.object({
  customer_id: z.number().optional(),
  site_id: z.number().optional(),
  skip_site: z.boolean().optional().catch(false),
});

type Target =
  | { type: "site"; data: Site }
  | { type: "customer"; data: Customer };

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ledger/new",
  component: NewLedgerPage,
  validateSearch: (search) => ledgerSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({
    customer_id: search.customer_id,
    site_id: search.site_id,
    skip_site: search.skip_site,
  }),
  loader: async ({
    deps: { customer_id, site_id },
  }): Promise<{
    customer: Customer | null;
    site: Site | null;
  }> => {
    try {
      let customer = null;
      let site = null;
      if (site_id) {
        site = await siteService.get(site_id);
      }
      if (customer_id) {
        customer = await customerService.get(customer_id);
      }
      return { customer, site };
    } catch (_e) {
      return { customer: null, site: null };
    }
  },
  pendingComponent: LedgerLoadingSkeleton,
});

// --- Schemas & Constants ---

const DATE_FORMAT = "dd-MM-yyyy";

const DEFAULT_FORM_VALUES: Partial<CreateLedger> = {
  amount: 0,
  date: format(new Date(), DATE_FORMAT),
  notes: "",
  type: "payment",
};

// --- Custom Components ---

function FormFieldWrapper({
  form,
  name,
  label,
  icon: Icon,
  required,
  placeholder,
  type = "text",
  maxLength,
  isCurrency = false,
  helperText,
}: any) {
  return (
    <form.Field
      name={name}
      children={(field: any) => {
        const hasError = field.state.meta.errors.length > 0;
        return (
          <div className="flex flex-col gap-1.5 group">
            <label className="text-sm font-semibold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                {label} {required && <span className="text-rose-500">*</span>}
              </span>
            </label>
            <div className="relative relative-group">
              {Icon && !isCurrency && (
                <Icon
                  className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                    hasError
                      ? "text-rose-500"
                      : "text-zinc-500 group-focus-within:text-emerald-500",
                  )}
                />
              )}
              {isCurrency && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xl pointer-events-none group-focus-within:text-emerald-400">
                  ₹
                </span>
              )}
              <Input
                value={
                  field.state.value === 0 && type === "number"
                    ? ""
                    : (field.state.value ?? "")
                }
                onChange={(e) =>
                  field.handleChange(
                    type === "number"
                      ? e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                      : e.target.value,
                  )
                }
                onBlur={field.handleBlur}
                placeholder={placeholder}
                type={type}
                maxLength={maxLength}
                className={cn(
                  "bg-zinc-950/50 hover:bg-zinc-900/50 focus:bg-zinc-950 focus:ring-1 transition-all h-14",
                  Icon && !isCurrency ? "pl-10" : "",
                  isCurrency
                    ? "pl-10 text-2xl font-bold text-white placeholder:text-zinc-700 shadow-[0_0_15px_-3px_rgba(16,185,129,0.05)] border-emerald-500/30 ring-emerald-500/50"
                    : "border-zinc-800/50",
                  hasError
                    ? "border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/50"
                    : "focus:border-emerald-500/50 focus:ring-emerald-500/50",
                )}
                onWheel={(e) => type === "number" && e.currentTarget.blur()}
              />
            </div>
            {helperText && !hasError && (
              <p className="text-[10px] text-zinc-500 mt-1 ml-1">
                {helperText}
              </p>
            )}
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
    />
  );
}

function FormProgressStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full py-2 mb-6">
      <div className="flex items-start justify-center max-w-2xl mx-auto px-2">
        {/* Step 1 */}
        <div className="flex flex-col items-center relative w-28 sm:w-32 shrink-0">
          <div
            className={cn(
              "rounded-full transition-all duration-500 flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 border-2 font-bold text-xs sm:text-sm z-10 bg-background",
              currentStep >= 1
                ? currentStep > 1
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-primary text-primary shadow-md shadow-primary/20"
                : "border-muted-foreground/30 text-muted-foreground",
            )}
          >
            {currentStep > 1 ? (
              <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
            ) : (
              "1"
            )}
          </div>
          <span
            className={cn(
              "text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mt-2 sm:mt-2.5 text-center transition-colors leading-tight",
              currentStep >= 1 ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Select
            <br className="sm:hidden" /> Customer
          </span>
        </div>

        {/* Divider 1 */}
        <div
          className={cn(
            "flex-1 border-t-2 transition-all duration-500 mt-4 sm:mt-5 -mx-6 sm:-mx-8 z-0",
            currentStep >= 2 ? "border-primary" : "border-border",
          )}
        />

        {/* Step 2 */}
        <div className="flex flex-col items-center relative w-28 sm:w-32 shrink-0">
          <div
            className={cn(
              "rounded-full transition-all duration-500 flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 border-2 font-bold text-xs sm:text-sm z-10 bg-background",
              currentStep >= 2
                ? currentStep > 2
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-primary text-primary shadow-md shadow-primary/20"
                : "border-muted-foreground/30 text-muted-foreground",
            )}
          >
            {currentStep > 2 ? (
              <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
            ) : (
              "2"
            )}
          </div>
          <span
            className={cn(
              "text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mt-2 sm:mt-2.5 text-center transition-colors leading-tight",
              currentStep >= 2 ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Select
            <br className="sm:hidden" /> Site
          </span>
        </div>

        {/* Divider 2 */}
        <div
          className={cn(
            "flex-1 border-t-2 transition-all duration-500 mt-4 sm:mt-5 -mx-6 sm:-mx-8 z-0",
            currentStep >= 3 ? "border-primary" : "border-border",
          )}
        />

        {/* Step 3 */}
        <div className="flex flex-col items-center relative w-28 sm:w-32 shrink-0">
          <div
            className={cn(
              "rounded-full transition-all duration-500 flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 border-2 font-bold text-xs sm:text-sm z-10 bg-background",
              currentStep >= 3
                ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20"
                : "border-muted-foreground/30 text-muted-foreground",
            )}
          >
            3
          </div>
          <span
            className={cn(
              "text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mt-2 sm:mt-2.5 text-center transition-colors leading-tight",
              currentStep >= 3 ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Payment
            <br className="sm:hidden" /> Details
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function NewLedgerPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const { customer, site } = Route.useLoaderData();
  const { customer_id, site_id, skip_site } = searchParams;

  const [createdEntry, setCreatedEntry] = useState<any | null>(null);
  const [formKey, setFormKey] = useState(0);
  const successRef = useRef<HTMLDivElement>(null);

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

  const handleChangeTarget = () => {
    setCreatedEntry(null);
    setFormKey(0);
    navigate({
      to: "/ledger/new",
      search: {},
    });
  };

  const handleAddAnother = () => {
    setCreatedEntry(null);
    setFormKey(0);
    navigate({
      to: "/ledger/new",
      search: {},
    });
  };

  let currentStep = 1;
  if (site_id || (customer_id && skip_site)) {
    currentStep = 3;
  } else if (customer_id) {
    currentStep = 2;
  }

  let finalTarget: Target | null = null;
  if (currentStep === 3) {
    if (site_id && site) {
      finalTarget = { type: "site", data: site };
    } else if (customer_id && customer) {
      finalTarget = { type: "customer", data: customer };
    }
  }

  return (
    <div className="flex-1 w-full max-w-[100vw] lg:max-w-6xl lg:mx-auto px-2 py-6 sm:p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24 overflow-x-hidden min-w-0">
      <Header
        step={currentStep}
        hasTarget={currentStep === 3}
        onChangeTarget={handleChangeTarget}
        onBackToLedger={() => navigate({ to: "/ledger" })}
      />

      <FormProgressStepper currentStep={currentStep} />

      {currentStep === 1 && (
        <CustomerSelectionStep
          onSelect={(c) => {
            navigate({
              to: "/ledger/new",
              search: { customer_id: c.id },
            });
          }}
        />
      )}

      {currentStep === 2 && customer && (
        <CustomerSiteSelectionStep
          customer={customer}
          onSelect={(s) => {
            navigate({
              to: "/ledger/new",
              search: { customer_id: customer.id, site_id: s.id },
            });
          }}
          onSkip={() => {
            navigate({
              to: "/ledger/new",
              search: { customer_id: customer.id, skip_site: true },
            });
          }}
          onGoBack={() => {
            navigate({
              to: "/ledger/new",
              search: {},
            });
          }}
        />
      )}

      {currentStep === 3 && finalTarget && (
        <LedgerEntryForm
          key={formKey}
          target={finalTarget}
          onSuccess={setCreatedEntry}
          onReset={() => setCreatedEntry(null)}
          onChangeTarget={handleChangeTarget}
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
              label: "Add Another Payment",
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
  hasTarget,
  onChangeTarget,
  onBackToLedger,
}: {
  step: number;
  hasTarget: boolean;
  onChangeTarget: () => void;
  onBackToLedger: () => void;
}) {
  let stepText = "";
  if (step === 1) stepText = "Step 1: Select Customer";
  else if (step === 2) stepText = "Step 2: Select Site (Optional)";
  else if (step === 3) stepText = "Step 3: Enter Payment Details";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          New Payment
        </h2>
        <p className="text-sm text-muted-foreground font-medium">{stepText}</p>
      </div>
      <div className="flex items-center gap-2">
        {hasTarget && (
          <Button
            variant="outline"
            onClick={onChangeTarget}
            className="hidden sm:flex cursor-pointer border-border hover:bg-muted text-foreground/80 h-9 px-4"
          >
            <User className="mr-2 h-4 w-4" /> Change Target
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={onBackToLedger}
          className="hidden sm:flex hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer h-9 px-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ledger
        </Button>
      </div>
    </div>
  );
}

// --- Step 1: Customer Selection ---

function CustomerSelectionStep({
  onSelect,
}: {
  onSelect: (c: Customer) => void;
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [filters, setFilters] = useState({
    name: "",
    mobile_no: "",
  });

  const debouncedFilters = useDebounce(filters, 500);

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["customers", "select", { page, perPage, ...debouncedFilters }],
    queryFn: () =>
      customerService.search({
        page,
        per_page: perPage,
        name: debouncedFilters.name || undefined,
        mobile_no: debouncedFilters.mobile_no || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters({ name: "", mobile_no: "" });
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-zinc-100">Find Customer</h3>
        <p className="text-zinc-400">
          Select the master customer who is making this payment.
        </p>
      </div>

      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl animate-in fade-in duration-500 relative overflow-hidden min-w-0">
        <CardContent className="p-2 sm:p-6 pt-4 sm:pt-6 min-w-0">
          <div className="min-w-0 w-full">
            <CustomerDataGrid
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

// --- Step 2: Site Selection ---

function CustomerSiteSelectionStep({
  customer,
  onSelect,
  onSkip,
  onGoBack,
}: {
  customer: Customer;
  onSelect: (s: Site) => void;
  onSkip: () => void;
  onGoBack: () => void;
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
    queryKey: [
      "sites",
      "select",
      { customer_id: customer.id, page, perPage, ...debouncedFilters },
    ],
    queryFn: () =>
      siteService.search({
        customer_id: customer.id,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            Select Site{" "}
            <Badge
              variant="secondary"
              className="ml-2 bg-zinc-800 text-zinc-300"
            >
              Optional
            </Badge>
          </h3>
          <p className="text-zinc-400">
            Select a specific site for{" "}
            <span className="font-semibold text-zinc-300">{customer.name}</span>
            , or skip to record payment at the master level.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="ghost"
            onClick={onGoBack}
            className="hidden sm:flex hover:bg-zinc-800 text-zinc-400"
          >
            Back
          </Button>
          <Button
            onClick={onSkip}
            className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer group"
          >
            Skip Site Selection
            <SkipForward className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
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

// --- Step 3: Form ---

function LedgerEntryForm({
  target,
  onSuccess,
  onReset,
  onChangeTarget,
}: {
  target: Target;
  onSuccess: (data: any) => void;
  onReset: () => void;
  onChangeTarget: () => void;
}) {
  const queryClient = useQueryClient();

  const isSite = target.type === "site";
  const targetName =
    target.type === "site" ? target.data.contractor_name : target.data.name;
  const targetId = target.data.id;
  const targetMobile = target.data.mobile_no;

  const mutation = useMutation({
    mutationFn: (data: CreateLedger) => ledgerService.create(data),
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      if (target.type === "site") {
        queryClient.invalidateQueries({ queryKey: ["sites", target.data.id] });
      } else {
        queryClient.invalidateQueries({
          queryKey: ["customers", target.data.id],
        });
      }
    },
  });

  const form = useForm({
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      ...(target.type === "site"
        ? { site_id: target.data.id }
        : { customer_id: target.data.id }),
    } as CreateLedger,
    validators: {
      onSubmit: createLedgerSchema,
    },
    onSubmit: async ({ value }) => {
      const submitData = {
        ...value,
        site_id: target.type === "site" ? target.data.id : undefined,
        customer_id:
          target.type === "site" ? target.data.customer_id : target.data.id,
      };
      mutation.mutate(submitData);
    },
  });

  const formValues = useStore(form.store, (state: any) => state.values);

  const handleResetForm = () => {
    form.reset({
      ...DEFAULT_FORM_VALUES,
      ...(target.type === "site"
        ? { site_id: target.data.id }
        : { customer_id: target.data.id }),
    } as CreateLedger);
    onReset();
    mutation.reset();
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
        setTimeout(() => {
          const firstError = document.querySelector(
            ".text-rose-400, .text-rose-500, [class*='border-rose-500']",
          );
          if (firstError) {
            firstError.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 100);
      }}
      className="animate-in slide-in-from-right-4 duration-300 min-w-0 w-full space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-w-0">
        {/* Left Column: Input Form fields */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          {/* Header Info */}
          <div className="flex items-center justify-between bg-card/60 border border-border/80 p-4 rounded-xl shadow-md backdrop-blur-md min-w-0">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className="h-10 w-10 border border-border shrink-0">
                <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                  {getInitials(targetName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground hover:underline truncate">
                    <Link
                      to={isSite ? "/sites/$siteId" : "/customers/$customerId"}
                      params={
                        isSite
                          ? { siteId: targetId.toString() }
                          : { customerId: targetId.toString() }
                      }
                    >
                      {targetName}
                    </Link>
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  ID: #{targetId} • {targetMobile}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <Badge
                variant="outline"
                className={cn(
                  "hidden sm:flex pl-1.5 pr-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wider uppercase",
                  target.data.active
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground border-border",
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 h-1.5 w-1.5 rounded-full",
                    target.data.active
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-muted-foreground",
                  )}
                />
                {target.data.active ? "Active" : "Inactive"}
              </Badge>
              <Button
                type="button"
                variant="outline"
                onClick={onChangeTarget}
                className="sm:hidden w-full cursor-pointer border-border hover:bg-muted text-foreground text-xs h-9 px-3"
              >
                <User className="mr-1.5 h-3.5 w-3.5" /> Change
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onChangeTarget}
                className="hidden sm:flex cursor-pointer border-border hover:bg-muted text-foreground h-10 px-4"
              >
                <User className="mr-2 h-4 w-4" /> Change Payer
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
                Record a cash or bank payment received.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Transaction Type */}
                <form.Field name="type">
                  {(field) => {
                    const hasError = field.state.meta.errors.length > 0;
                    return (
                      <div className="flex flex-col gap-1.5 group mb-5">
                        <label className="text-sm font-semibold text-zinc-300">
                          Transaction Type
                        </label>
                        <Select
                          value={field.state.value}
                          onValueChange={(val: any) => field.handleChange(val)}
                        >
                          <SelectTrigger
                            className={cn(
                              "w-full h-14 bg-zinc-950/50 border-zinc-800 text-zinc-200 focus:border-emerald-500/50 focus:ring-emerald-500/50 transition-all",
                              hasError &&
                                "border-rose-500/50 focus:border-rose-500/50",
                            )}
                          >
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

                {/* Amount Field */}
                <FormFieldWrapper
                  form={form}
                  name="amount"
                  label="Payment Amount"
                  isCurrency={true}
                  placeholder="0.00"
                  type="number"
                  helperText="Enter the exact monetary value received."
                />

                {/* Date Field */}
                <form.Field name="date">
                  {(field) => {
                    const hasError = field.state.meta.errors.length > 0;
                    return (
                      <div className="flex flex-col gap-1.5 group mb-5">
                        <label className="text-sm font-semibold text-zinc-300">
                          Transaction Date
                        </label>
                        <FilterDatePicker
                          value={field.state.value}
                          max={format(new Date(), "yyyy-MM-dd")}
                          onChange={(val) => field.handleChange(val)}
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

              {/* Notes Field */}
              <form.Field name="notes">
                {(field) => {
                  const hasError = field.state.meta.errors.length > 0;
                  return (
                    <div className="flex flex-col gap-1.5 group mb-5">
                      <label className="text-sm font-semibold text-zinc-300">
                        Payment Notes / Reference
                      </label>
                      <textarea
                        id={field.name}
                        placeholder="e.g. Google Pay reference, Cheque number, Paid in cash, Part payment details..."
                        className={cn(
                          "w-full min-h-[96px] bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-700",
                          hasError &&
                            "border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/50",
                        )}
                        value={field.state.value || ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <p className="text-[10px] text-zinc-500 mt-1 ml-1">
                        Add any payment reference, bank details, or operator
                        remarks.
                      </p>
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

              {/* Target Segment */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">
                  Received From {isSite ? "(Site)" : "(Customer)"}
                </span>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                    {getInitials(targetName)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      {targetName}
                    </p>
                    <p className="text-[10px] text-zinc-550">
                      ID: #{targetId} • {targetMobile}
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

            {/* Total Paid Block */}
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
