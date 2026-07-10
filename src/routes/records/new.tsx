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
  AlertCircle,
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Hash,
  Loader2,
  Plus,
  Save,
  Trash2,
  Truck,
  User,
  Wrench,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { Site } from "@/schemas/siteSchema";
import { PART_OPTIONS, getSizesForPart } from "@/schemas/common";
import {
  type CreateRecord,
  createRecordSchema,
  type Record,
} from "@/schemas/recordSchema";
import { siteService } from "@/services/siteService";
import { recordService } from "@/services/recordService";
import { formatDate, getInitials } from "@/utils";

// --- Route Definition ---

const recordSearchSchema = z.object({
  site_id: z.number().optional(),
});

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/records/new",
  component: NewRecordPage,
  validateSearch: (search) => recordSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ site_id: search.site_id }),
  loader: async ({ deps: { site_id } }) => {
    if (!site_id) return { site: null };
    try {
      const site = await siteService.get(site_id);
      return { site };
    } catch (_e) {
      // If ID is invalid, return null so we can show selection screen
      return { site: null };
    }
  },
  pendingComponent: RecordLoadingSkeleton,
});

// --- Constants ---
const DATE_FORMAT = "dd-MM-yyyy";

const DEFAULT_FORM_VALUES: Partial<CreateRecord> = {
  site_id: 0,
  date: format(new Date(), DATE_FORMAT),
  transaction_type: "OUT",
  labour_charge: 0,
  transport_charge: 0,
  total: 0,
  vehicle_no: "",
  vehicle_mobile_no: "",
  items: [
    {
      part: "full",
      size: "2.0",
      item_amount: 0,
      broken_amount: 0,
      broken_charge: 0,
      service_charge: 0,
      lost_amount: 0,
      lost_charge: 0,
    },
  ],
};

// --- Custom Components ---

function FormProgressStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full py-2 mb-6">
      <div className="flex items-start justify-center max-w-sm mx-auto px-2">
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
            <br className="sm:hidden" /> Site
          </span>
        </div>

        {/* Divider */}
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
                ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20"
                : "border-muted-foreground/30 text-muted-foreground",
            )}
          >
            2
          </div>
          <span
            className={cn(
              "text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mt-2 sm:mt-2.5 text-center transition-colors leading-tight",
              currentStep >= 2 ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Record
            <br className="sm:hidden" /> Details
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function NewRecordPage() {
  const navigate = useNavigate();
  const { site } = Route.useLoaderData();
  const [createdRecord, setCreatedRecord] = useState<Record | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (createdRecord && successRef.current) {
      setTimeout(() => {
        successRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [createdRecord]);

  const handleSiteSelect = (selected: Site) => {
    navigate({
      to: "/records/new",
      search: { site_id: selected.id },
    });
  };

  const handleChangeSite = () => {
    setCreatedRecord(null);
    navigate({
      to: "/records/new",
      search: { site_id: undefined },
    });
  };

  return (
    <div className="flex-1 w-full max-w-[100vw] lg:max-w-6xl lg:mx-auto px-2 py-6 sm:p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-24 overflow-x-hidden min-w-0">
      <Header
        step={site ? 2 : 1}
        hasSite={!!site}
        onChangeSite={handleChangeSite}
      />

      <FormProgressStepper currentStep={site ? 2 : 1} />

      <div className="pt-4">
        {!site ? (
          <SiteSelectionStep onSelect={handleSiteSelect} />
        ) : (
          <RecordEntryForm
            site={site}
            onSuccess={setCreatedRecord}
            onReset={handleChangeSite}
          />
        )}
      </div>

      {createdRecord && (
        <div ref={successRef}>
          <NewRecordSuccessFeedback
            record={createdRecord}
            onDismiss={() => setCreatedRecord(null)}
            onReset={handleChangeSite}
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          New Record
        </h2>
        <p className="text-sm text-muted-foreground font-medium">
          {step === 1
            ? "Step 1: Locate an active site"
            : "Step 2: Enter inventory movements and charges"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {hasSite && (
          <Button
            variant="outline"
            onClick={onChangeSite}
            className="hidden sm:flex cursor-pointer border-border hover:bg-muted text-foreground/80 h-9 px-4"
          >
            <User className="mr-2 h-4 w-4" /> Change Site
          </Button>
        )}
        <Button
          variant="ghost"
          asChild
          className="hidden sm:flex hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer h-9 px-4"
        >
          <Link to="/records">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Link>
        </Button>
      </div>
    </div>
  );
}

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
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1 px-1 sm:px-0">
        <h3 className="text-lg sm:text-xl font-bold text-foreground">
          Find Site
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground">
          Search for an existing site to register an inventory movement.
        </p>
      </div>
      <div className="bg-background sm:bg-card/60 sm:border border-border/80 sm:shadow-xl relative overflow-hidden animate-in fade-in duration-500 sm:rounded-xl sm:backdrop-blur-md min-w-0">
        <div className="py-2 sm:p-6 min-w-0 w-full">
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
      </div>
    </div>
  );
}

function RecordEntryForm({
  site,
  onSuccess,
  onReset,
}: {
  site: Site;
  onSuccess: (data: Record) => void;
  onReset: () => void;
}) {
  const queryClient = useQueryClient();
  const [showTransport, setShowTransport] = useState(false);

  const form = useAppForm({
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      site_id: site.id,
    } as CreateRecord,
    validators: {
      onSubmit: createRecordSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateRecord) => recordService.create(data),
    onSuccess: (data) => {
      onSuccess(data);
      form.reset({
        ...DEFAULT_FORM_VALUES,
        site_id: site.id,
      } as CreateRecord);
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({ queryKey: ["sites", site.id] });
    },
  });

  const handleResetForm = () => {
    form.reset({
      ...DEFAULT_FORM_VALUES,
      site_id: site.id,
    } as CreateRecord);
    onReset();
    mutation.reset();
  };

  // Subscribe to react-form store values reactively to do totals calculations
  const formValues = useStore(form.store, (state: any) => state.values);
  const items = formValues.items || [];

  const calculatedTotalItems = items.reduce(
    (acc: number, item: any) =>
      acc +
      (item.part === "full" || item.part === "plate"
        ? (item.item_amount || 0) +
          (item.broken_amount || 0) +
          (item.lost_amount || 0)
        : 0),
    0,
  );

  const calculatedLabourCharge = items.reduce((acc: number, item: any) => {
    const totalQty =
      (item.item_amount || 0) +
      (item.broken_amount || 0) +
      (item.lost_amount || 0);
    if (item.part === "plate") {
      return acc + totalQty * 2;
    }
    if (item.part === "full") {
      return acc + totalQty * 3;
    }
    return acc;
  }, 0);

  const lastCalculatedTotalRef = useRef(0);
  const lastCalculatedLabourRef = useRef(0);

  // Dynamic automatic calculation of Total Items & Labour charges
  useEffect(() => {
    if (
      calculatedTotalItems !== lastCalculatedTotalRef.current ||
      calculatedLabourCharge !== lastCalculatedLabourRef.current
    ) {
      lastCalculatedTotalRef.current = calculatedTotalItems;
      lastCalculatedLabourRef.current = calculatedLabourCharge;
      form.setFieldValue("total", calculatedTotalItems);
      form.setFieldValue("labour_charge", calculatedLabourCharge);
    }
  }, [calculatedTotalItems, calculatedLabourCharge, form]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6 animate-in slide-in-from-right-4 duration-300 min-w-0 w-full"
    >
      <form.Field name="site_id">
        {(field) => (
          <input type="hidden" name={field.name} value={field.state.value} />
        )}
      </form.Field>

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
            onClick={handleResetForm}
            className="sm:hidden w-full cursor-pointer border-border hover:bg-muted text-foreground text-xs h-9 px-3"
          >
            <User className="mr-1.5 h-3.5 w-3.5" /> Change
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleResetForm}
            className="hidden sm:flex cursor-pointer border-border hover:bg-muted text-foreground h-10 px-4"
          >
            <User className="mr-2 h-4 w-4" /> Change Site
          </Button>
        </div>
      </div>

      {mutation.isError && <ErrorAlert error={mutation.error} />}

      {/* Transaction Details */}
      <Card className="bg-card/40 border-border/80 backdrop-blur-md shadow-xl relative overflow-hidden rounded-xl min-w-0">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Hash className="h-4 w-4 text-primary" />
            Record Info & Type
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form.Field name="id">
              {(field) => (
                <FormBase field={field} label="Chalan No. (Record ID)">
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={field.name}
                      type="number"
                      placeholder="Enter Chalan Number"
                      className="pl-9 bg-background/50 border-border/80 font-bold text-lg focus:border-primary/50 focus:ring-primary/20 transition-all h-10"
                      value={field.state.value || ""}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                      onWheel={(e) => e.currentTarget.blur()}
                      autoFocus
                    />
                  </div>
                </FormBase>
              )}
            </form.Field>

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
                            "w-full pl-3 text-left font-normal bg-background/50 border-border/80 hover:bg-muted hover:text-foreground focus:border-primary/50 focus:ring-primary/20 transition-all h-10",
                            !dateValue && "text-muted-foreground",
                          )}
                        >
                          {dateValue ? (
                            format(dateValue, DATE_FORMAT)
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-popover border border-border shadow-lg rounded-xl"
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
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          autoFocus
                          className="rounded-xl border-none"
                        />
                      </PopoverContent>
                    </Popover>
                  </FormBase>
                );
              }}
            </form.Field>

            <form.Field name="transaction_type">
              {(field) => (
                <FormBase field={field} label="Transaction Type">
                  <div className="relative flex p-1 bg-muted/60 border border-border/85 rounded-lg w-full h-10 items-center">
                    <div
                      className={cn(
                        "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md transition-all duration-300 shadow-sm",
                        field.state.value === "OUT"
                          ? "left-1 bg-rose-500/15 border border-rose-500/30 dark:bg-rose-950/40"
                          : "left-[calc(50%+2px)] bg-emerald-500/15 border border-emerald-500/30 dark:bg-emerald-950/40",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => field.handleChange("OUT")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-semibold z-10 text-center rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 h-8",
                        field.state.value === "OUT"
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          field.state.value === "OUT"
                            ? "bg-rose-500 animate-pulse"
                            : "bg-zinc-500/40",
                        )}
                      />
                      OUT (Delivery)
                    </button>
                    <button
                      type="button"
                      onClick={() => field.handleChange("IN")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-semibold z-10 text-center rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 h-8",
                        field.state.value === "IN"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          field.state.value === "IN"
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-zinc-500/40",
                        )}
                      />
                      IN (Return)
                    </button>
                  </div>
                </FormBase>
              )}
            </form.Field>
          </div>

          <div className="pt-4 border-t border-border/80">
            <button
              type="button"
              onClick={() => setShowTransport(!showTransport)}
              className="flex items-center justify-between w-full py-2 hover:text-foreground text-muted-foreground transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary group-hover:animate-bounce" />
                <span className="text-xs font-bold tracking-wider uppercase">
                  Transport & Driver details
                </span>
                <span className="text-[10px] font-normal text-muted-foreground/80 px-2 py-0.5 bg-muted rounded-full ml-2">
                  Optional
                </span>
              </div>
              {showTransport ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showTransport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 animate-in slide-in-from-top-2 duration-300">
                <form.Field name="vehicle_no">
                  {(field) => (
                    <FormBase
                      field={field}
                      label="Vehicle Number"
                      className="mb-2"
                    >
                      <Input
                        id={field.name}
                        placeholder="e.g. GJ-05-AB-1234"
                        className="bg-background/50 border-border/80 focus:border-primary/50 focus:ring-primary/20 transition-all font-mono"
                        value={field.state.value || ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </FormBase>
                  )}
                </form.Field>
                <form.Field name="vehicle_mobile_no">
                  {(field) => (
                    <FormBase
                      field={field}
                      label="Driver Mobile"
                      className="mb-2"
                    >
                      <Input
                        id={field.name}
                        placeholder="e.g. 9876543210"
                        className="bg-background/50 border-border/80 focus:border-primary/50 focus:ring-primary/20 transition-all font-mono"
                        value={field.state.value || ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </FormBase>
                  )}
                </form.Field>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card className="bg-card/40 border-border/80 backdrop-blur-md shadow-xl flex flex-col relative overflow-hidden rounded-xl min-w-0">
        <form.Field name="items" mode="array">
          {(field) => (
            <>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold text-foreground">
                    Items List
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Record quantities, part sizes, and any damage or loss
                    charges.
                  </CardDescription>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm font-medium text-rose-500 mt-1 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" />{" "}
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    field.pushValue({
                      part: "full",
                      size: "2.0",
                      item_amount: 0,
                      broken_amount: 0,
                      broken_charge: 0,
                      service_charge: 0,
                      lost_amount: 0,
                      lost_charge: 0,
                    })
                  }
                  className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-semibold cursor-pointer h-9 px-4 self-start sm:self-center"
                >
                  <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" /> Add Item Row
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                {/* Desktop View: Styled Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-border/60 hover:bg-transparent">
                        <TableHead className="w-[18%] pl-6 text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                          Part Type
                        </TableHead>
                        <TableHead className="w-[12%] text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                          Size
                        </TableHead>
                        <TableHead className="w-[14%] text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                          Good Qty
                        </TableHead>
                        <TableHead className="w-[12%] text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                          Broken Qty
                        </TableHead>
                        <TableHead className="w-[12%] text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                          Lost Qty
                        </TableHead>
                        <TableHead className="w-[12%] text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                          Broken Charge
                        </TableHead>
                        <TableHead className="w-[14%] text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                          Service Charge
                        </TableHead>
                        <TableHead className="w-[14%] text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                          Lost Charge
                        </TableHead>
                        <TableHead className="w-[6%] pr-6"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border/60">
                      {field.state.value.map((_, index) => {
                        const rowPart = items[index]?.part || "full";
                        const allowedSizes = getSizesForPart(rowPart);
                        return (
                          <TableRow
                            key={index}
                            className="hover:bg-muted/20 border-border/40 group transition-colors"
                          >
                            <TableCell className="pl-6 py-3.5 align-top">
                              <form.Field name={`items[${index}].part`}>
                                {(subField) => (
                                  <FormBase field={subField} className="mb-0">
                                    <Select
                                      value={subField.state.value}
                                      onValueChange={(val) => {
                                        subField.handleChange(
                                          val as
                                            | "full"
                                            | "inner"
                                            | "outer"
                                            | "plate",
                                        );
                                        // Set a valid size default when part type changes
                                        const defaultSize =
                                          val === "plate" ? "2x3" : "2.0";
                                        form.setFieldValue(
                                          `items[${index}].size`,
                                          defaultSize,
                                        );
                                      }}
                                    >
                                      <SelectTrigger className="border-border/80 bg-background/50 hover:bg-muted/50 focus:border-primary/50 focus:ring-primary/20 transition-all cursor-pointer h-9 text-xs">
                                        <SelectValue placeholder="Select Part" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {PART_OPTIONS.map((opt) => (
                                          <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                            className="cursor-pointer text-xs"
                                          >
                                            {opt.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormBase>
                                )}
                              </form.Field>
                            </TableCell>

                            <TableCell className="py-3.5 align-top">
                              <form.Field name={`items[${index}].size`}>
                                {(subField) => (
                                  <FormBase field={subField} className="mb-0">
                                    <Select
                                      value={subField.state.value}
                                      onValueChange={(val) =>
                                        subField.handleChange(val)
                                      }
                                    >
                                      <SelectTrigger className="border-border/80 bg-background/50 hover:bg-muted/50 focus:border-primary/50 focus:ring-primary/20 transition-all cursor-pointer h-9 text-xs">
                                        <SelectValue placeholder="Size" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {allowedSizes.map((size) => (
                                          <SelectItem
                                            key={size}
                                            value={String(size)}
                                            className="cursor-pointer text-xs"
                                          >
                                            {size}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormBase>
                                )}
                              </form.Field>
                            </TableCell>

                            <TableCell className="py-3.5 align-top">
                              <form.Field name={`items[${index}].item_amount`}>
                                {(subField) => (
                                  <FormBase field={subField} className="mb-0">
                                    <Input
                                      type="number"
                                      className="border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 focus:border-primary/60 focus:ring-primary/25 transition-all h-9 text-xs font-bold text-center"
                                      placeholder="0"
                                      value={
                                        subField.state.value === 0
                                          ? ""
                                          : subField.state.value
                                      }
                                      onChange={(e) =>
                                        subField.handleChange(
                                          Number(e.target.value),
                                        )
                                      }
                                      onWheel={(e) => e.currentTarget.blur()}
                                    />
                                  </FormBase>
                                )}
                              </form.Field>
                            </TableCell>

                            <TableCell className="py-3.5 align-top text-center">
                              <form.Field
                                name={`items[${index}].broken_amount`}
                              >
                                {(subField) => (
                                  <FormBase field={subField} className="mb-0">
                                    <div className="flex justify-center">
                                      <Input
                                        type="number"
                                        className="border-rose-500/20 bg-rose-500/5 text-center hover:bg-rose-500/10 focus:border-rose-500/50 focus:ring-rose-500/10 transition-all h-9 text-xs text-rose-600 dark:text-rose-450 font-bold"
                                        placeholder="0"
                                        value={
                                          subField.state.value === 0
                                            ? ""
                                            : subField.state.value
                                        }
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          subField.handleChange(val);
                                          // Auto-calculate broken charge
                                          form.setFieldValue(
                                            `items[${index}].broken_charge`,
                                            val * 100,
                                          );
                                        }}
                                        onWheel={(e) => e.currentTarget.blur()}
                                      />
                                    </div>
                                  </FormBase>
                                )}
                              </form.Field>
                            </TableCell>

                            <TableCell className="py-3.5 align-top text-center">
                              <form.Field name={`items[${index}].lost_amount`}>
                                {(subField) => (
                                  <FormBase field={subField} className="mb-0">
                                    <div className="flex justify-center">
                                      <Input
                                        type="number"
                                        className="border-rose-500/20 bg-rose-500/5 text-center hover:bg-rose-500/10 focus:border-rose-500/50 focus:ring-rose-500/10 transition-all h-9 text-xs text-rose-600 dark:text-rose-450 font-bold"
                                        placeholder="0"
                                        value={
                                          subField.state.value === 0
                                            ? ""
                                            : subField.state.value
                                        }
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          subField.handleChange(val);
                                        }}
                                        onWheel={(e) => e.currentTarget.blur()}
                                      />
                                    </div>
                                  </FormBase>
                                )}
                              </form.Field>
                            </TableCell>

                            <TableCell className="py-3.5 align-top text-center">
                              <form.Field
                                name={`items[${index}].broken_charge`}
                              >
                                {(subField) => (
                                  <FormBase field={subField} className="mb-0">
                                    <div className="relative flex items-center justify-center">
                                      <span className="absolute left-2.5 text-rose-500 text-xs font-semibold">
                                        ₹
                                      </span>
                                      <Input
                                        type="number"
                                        className="pl-5 border-rose-500/20 bg-rose-500/5 text-center hover:bg-rose-500/10 focus:border-rose-500/50 focus:ring-rose-500/10 transition-all h-9 text-xs text-rose-600 dark:text-rose-450 font-bold"
                                        placeholder="0"
                                        value={
                                          subField.state.value === 0
                                            ? ""
                                            : subField.state.value
                                        }
                                        onChange={(e) =>
                                          subField.handleChange(
                                            Number(e.target.value),
                                          )
                                        }
                                        onWheel={(e) => e.currentTarget.blur()}
                                      />
                                    </div>
                                  </FormBase>
                                )}
                              </form.Field>
                            </TableCell>

                            <TableCell className="py-3.5 align-top text-center">
                              <form.Field
                                name={`items[${index}].service_charge`}
                              >
                                {(subField) => (
                                  <FormBase field={subField} className="mb-0">
                                    <div className="relative flex items-center justify-center">
                                      <span className="absolute left-2.5 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                                        ₹
                                      </span>
                                      <Input
                                        type="number"
                                        className="pl-5 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-center font-bold h-9 text-xs focus:border-amber-500/50 focus:ring-amber-500/10 transition-all"
                                        placeholder="0"
                                        value={
                                          subField.state.value === 0
                                            ? ""
                                            : subField.state.value
                                        }
                                        onChange={(e) =>
                                          subField.handleChange(
                                            Number(e.target.value),
                                          )
                                        }
                                        onWheel={(e) => e.currentTarget.blur()}
                                      />
                                    </div>
                                  </FormBase>
                                )}
                              </form.Field>
                            </TableCell>

                            <TableCell className="py-3.5 align-top text-center">
                              <form.Field name={`items[${index}].lost_charge`}>
                                {(subField) => (
                                  <FormBase field={subField} className="mb-0">
                                    <div className="relative flex items-center justify-center">
                                      <span className="absolute left-2.5 text-rose-500 text-xs font-semibold">
                                        ₹
                                      </span>
                                      <Input
                                        type="number"
                                        className="pl-5 border-rose-500/20 bg-rose-500/5 text-center hover:bg-rose-500/10 focus:border-rose-500/50 focus:ring-rose-500/10 transition-all h-9 text-xs text-rose-600 dark:text-rose-450 font-bold"
                                        placeholder="0"
                                        value={
                                          subField.state.value === 0
                                            ? ""
                                            : subField.state.value
                                        }
                                        onChange={(e) =>
                                          subField.handleChange(
                                            Number(e.target.value),
                                          )
                                        }
                                        onWheel={(e) => e.currentTarget.blur()}
                                      />
                                    </div>
                                  </FormBase>
                                )}
                              </form.Field>
                            </TableCell>

                            <TableCell className="py-3.5 align-middle text-right pr-6">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 opacity-60 group-hover:opacity-100 transition-all cursor-pointer rounded-full"
                                onClick={() => field.removeValue(index)}
                                disabled={field.state.value.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View: Render Items as sleek Cards */}
                <div className="block md:hidden p-4 space-y-4 bg-muted/20 border-t border-border/50">
                  {field.state.value.map((_, index) => {
                    const mobileRowPart = items[index]?.part || "full";
                    const mobileAllowedSizes = getSizesForPart(mobileRowPart);

                    return (
                      <div
                        key={index}
                        className="p-4 bg-card border border-border/85 rounded-xl relative space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                      >
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">
                            Item #{index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all cursor-pointer"
                            onClick={() => field.removeValue(index)}
                            disabled={field.state.value.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <form.Field name={`items[${index}].part`}>
                            {(subField) => (
                              <FormBase
                                field={subField}
                                label="Part Type"
                                className="mb-0"
                              >
                                <Select
                                  value={subField.state.value}
                                  onValueChange={(val) => {
                                    subField.handleChange(
                                      val as
                                        | "full"
                                        | "inner"
                                        | "outer"
                                        | "plate",
                                    );
                                    // Set a valid size default when part type changes
                                    const defaultSize =
                                      val === "plate" ? "2x3" : "2.0";
                                    form.setFieldValue(
                                      `items[${index}].size`,
                                      defaultSize,
                                    );
                                  }}
                                >
                                  <SelectTrigger className="border-border/80 bg-background/50 h-9 text-xs">
                                    <SelectValue placeholder="Select Part" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PART_OPTIONS.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                        className="text-xs"
                                      >
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormBase>
                            )}
                          </form.Field>
                          <form.Field name={`items[${index}].size`}>
                            {(subField) => (
                              <FormBase
                                field={subField}
                                label="Size"
                                className="mb-0"
                              >
                                <Select
                                  value={subField.state.value}
                                  onValueChange={(val) =>
                                    subField.handleChange(val)
                                  }
                                >
                                  <SelectTrigger className="border-border/80 bg-background/50 h-9 text-xs">
                                    <SelectValue placeholder="Size" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {mobileAllowedSizes.map((size) => (
                                      <SelectItem
                                        key={size}
                                        value={String(size)}
                                        className="text-xs"
                                      >
                                        {size}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormBase>
                            )}
                          </form.Field>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <form.Field name={`items[${index}].item_amount`}>
                            {(subField) => (
                              <FormBase
                                field={subField}
                                label="Quantity"
                                className="mb-0"
                              >
                                <Input
                                  type="number"
                                  className="bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40 focus:border-primary/60 focus:ring-primary/20 transition-all h-9 text-xs font-bold text-center"
                                  placeholder="0"
                                  value={
                                    subField.state.value === 0
                                      ? ""
                                      : subField.state.value
                                  }
                                  onChange={(e) =>
                                    subField.handleChange(
                                      Number(e.target.value),
                                    )
                                  }
                                  onWheel={(e) => e.currentTarget.blur()}
                                />
                              </FormBase>
                            )}
                          </form.Field>
                          <form.Field name={`items[${index}].broken_amount`}>
                            {(subField) => (
                              <FormBase
                                field={subField}
                                label="Broken Qty"
                                className="mb-0"
                              >
                                <Input
                                  type="number"
                                  className="bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10 focus:border-rose-500/50 focus:ring-rose-500/10 transition-all text-center h-9 text-xs text-rose-600 dark:text-rose-450 font-bold"
                                  placeholder="0"
                                  value={
                                    subField.state.value === 0
                                      ? ""
                                      : subField.state.value
                                  }
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    subField.handleChange(val);
                                    form.setFieldValue(
                                      `items[${index}].broken_charge`,
                                      val * 100,
                                    );
                                  }}
                                  onWheel={(e) => e.currentTarget.blur()}
                                />
                              </FormBase>
                            )}
                          </form.Field>
                          <form.Field name={`items[${index}].lost_amount`}>
                            {(subField) => (
                              <FormBase
                                field={subField}
                                label="Lost Qty"
                                className="mb-0"
                              >
                                <Input
                                  type="number"
                                  className="bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10 focus:border-rose-500/50 focus:ring-rose-500/10 transition-all text-center h-9 text-xs text-rose-600 dark:text-rose-450 font-bold"
                                  placeholder="0"
                                  value={
                                    subField.state.value === 0
                                      ? ""
                                      : subField.state.value
                                  }
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    subField.handleChange(val);
                                  }}
                                  onWheel={(e) => e.currentTarget.blur()}
                                />
                              </FormBase>
                            )}
                          </form.Field>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/40">
                          <form.Field name={`items[${index}].broken_charge`}>
                            {(subField) => (
                              <FormBase
                                field={subField}
                                label="Broken ₹"
                                className="mb-0"
                              >
                                <div className="relative">
                                  <span className="absolute left-1.5 top-2 text-[10px] text-rose-500 font-semibold">
                                    ₹
                                  </span>
                                  <Input
                                    type="number"
                                    className="pl-4 pr-1 text-xs bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10 focus:border-rose-500/50 focus:ring-rose-500/10 transition-all text-center h-8 text-rose-600 dark:text-rose-450 font-bold"
                                    placeholder="0"
                                    value={
                                      subField.state.value === 0
                                        ? ""
                                        : subField.state.value
                                    }
                                    onChange={(e) =>
                                      subField.handleChange(
                                        Number(e.target.value),
                                      )
                                    }
                                    onWheel={(e) => e.currentTarget.blur()}
                                  />
                                </div>
                              </FormBase>
                            )}
                          </form.Field>
                          <form.Field name={`items[${index}].service_charge`}>
                            {(subField) => (
                              <FormBase
                                field={subField}
                                label="Service ₹"
                                className="mb-0"
                              >
                                <div className="relative">
                                  <span className="absolute left-1.5 top-2 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                    ₹
                                  </span>
                                  <Input
                                    type="number"
                                    className="pl-4 pr-1 text-xs bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 focus:border-amber-500/50 focus:ring-amber-500/10 transition-all text-center h-8 text-amber-600 dark:text-amber-400 font-bold"
                                    placeholder="0"
                                    value={
                                      subField.state.value === 0
                                        ? ""
                                        : subField.state.value
                                    }
                                    onChange={(e) =>
                                      subField.handleChange(
                                        Number(e.target.value),
                                      )
                                    }
                                    onWheel={(e) => e.currentTarget.blur()}
                                  />
                                </div>
                              </FormBase>
                            )}
                          </form.Field>
                          <form.Field name={`items[${index}].lost_charge`}>
                            {(subField) => (
                              <FormBase
                                field={subField}
                                label="Lost ₹"
                                className="mb-0"
                              >
                                <div className="relative">
                                  <span className="absolute left-1.5 top-2 text-[10px] text-rose-500 font-semibold">
                                    ₹
                                  </span>
                                  <Input
                                    type="number"
                                    className="pl-4 pr-1 text-xs bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10 focus:border-rose-500/50 focus:ring-rose-500/10 transition-all text-center h-8 text-rose-600 dark:text-rose-450 font-bold"
                                    placeholder="0"
                                    value={
                                      subField.state.value === 0
                                        ? ""
                                        : subField.state.value
                                    }
                                    onChange={(e) =>
                                      subField.handleChange(
                                        Number(e.target.value),
                                      )
                                    }
                                    onWheel={(e) => e.currentTarget.blur()}
                                  />
                                </div>
                              </FormBase>
                            )}
                          </form.Field>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </>
          )}
        </form.Field>
      </Card>

      {/* Overrides & Additional Charges */}
      <Card className="bg-card/40 border-border/80 backdrop-blur-md shadow-xl relative overflow-hidden rounded-xl min-w-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Wrench className="h-4 w-4 text-emerald-500" />
            Overrides & Additional Charges
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manually override default labor and transport parameters if needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Total Items Quantity Input */}
            <form.Field name="total">
              {(field) => (
                <FormBase
                  field={field}
                  label="Total Items Quantity"
                  className="mb-0"
                >
                  <Input
                    type="number"
                    placeholder="0"
                    className="bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40 focus:border-primary/60 focus:ring-primary/20 transition-all font-bold text-base h-10 px-3 text-foreground"
                    value={field.state.value === 0 ? "" : field.state.value}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      field.handleChange(val);
                      form.setFieldValue(`labour_charge`, val * 3);
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </FormBase>
              )}
            </form.Field>

            {/* Labour Charge Input */}
            <form.Field name="labour_charge">
              {(field) => (
                <FormBase
                  field={field}
                  label="Labour Charge (₹)"
                  className="mb-0"
                >
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      ₹
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="pl-7 bg-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-base h-10 focus:border-emerald-500/50 focus:ring-emerald-500/10 transition-all"
                      value={field.state.value === 0 ? "" : field.state.value}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                </FormBase>
              )}
            </form.Field>

            {/* Transport Charge Input */}
            <form.Field name="transport_charge">
              {(field) => (
                <FormBase
                  field={field}
                  label="Transport Charge (₹)"
                  className="mb-0"
                >
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-purple-600 dark:text-purple-400 font-medium">
                      ₹
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="pl-7 bg-purple-500/5 border-purple-500/30 text-purple-600 dark:text-purple-400 font-bold text-base h-10 focus:border-purple-500/50 focus:ring-purple-500/10 transition-all shadow-[0_0_15px_-3px_rgba(168,85,247,0.05)]"
                      value={field.state.value === 0 ? "" : field.state.value}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                </FormBase>
              )}
            </form.Field>
          </div>
        </CardContent>
      </Card>

      {/* Chalan Receipt Card */}
      <Card className="bg-card/40 border-border/80 backdrop-blur-md shadow-xl relative overflow-hidden rounded-xl min-w-0">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                Chalan Receipt
              </CardTitle>
            </div>
            <div className="text-left sm:text-right font-mono text-[10px] text-muted-foreground space-y-0.5">
              <div>
                Chalan No:{" "}
                <span className="font-bold text-foreground">
                  #{formValues.id || "TBD"}
                </span>
              </div>
              <div>
                Date: {formValues.date || format(new Date(), "yyyy-MM-dd")}
              </div>
              <div>
                Type:{" "}
                <span
                  className={cn(
                    "font-bold",
                    formValues.transaction_type === "IN"
                      ? "text-emerald-500"
                      : "text-rose-500",
                  )}
                >
                  {formValues.transaction_type || "OUT"}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-6 sm:pt-0 space-y-6">
          {/* Items Table */}
          <div className="rounded-xl border border-border/50 overflow-hidden bg-card shadow-sm m-4 sm:m-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Part
                  </TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Size
                  </TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">
                    Qty
                  </TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">
                    Broken
                  </TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">
                    Lost
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formValues.items &&
                formValues.items.filter((i: any) => i.part).length > 0 ? (
                  formValues.items
                    .filter((i: any) => i.part)
                    .map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-sm">
                          {PART_OPTIONS.find(
                            (p) => p.value === String(item.part),
                          )?.label ||
                            item.part ||
                            "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.size || "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {item.item_amount || 0}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-rose-500">
                          {item.broken_amount || 0}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-rose-500">
                          {item.lost_amount || 0}
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-6 text-sm"
                    >
                      No items added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Section */}
          <div className="flex flex-col items-end gap-2 pt-2 px-4 sm:px-2">
            <div className="flex justify-between items-center w-full sm:w-64 text-sm border-b border-border/30 pb-1">
              <span className="text-muted-foreground font-medium">
                Total Qty
              </span>
              <span className="font-bold text-foreground font-mono">
                {formValues.total || 0}
              </span>
            </div>
            <div className="flex justify-between items-center w-full sm:w-64 text-sm border-b border-border/30 pb-1">
              <span className="text-muted-foreground font-medium">
                Labour Charge
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{(formValues.labour_charge || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center w-full sm:w-64 text-sm">
              <span className="text-muted-foreground font-medium">
                Transport Charge
              </span>
              <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">
                ₹{(formValues.transport_charge || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
        <Button
          variant="ghost"
          type="button"
          onClick={handleResetForm}
          disabled={mutation.isPending}
          className="hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer h-10 px-4 text-xs font-semibold"
        >
          Reset Form
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="min-w-40 bg-primary hover:bg-primary/95 text-primary-foreground border-none shadow-md shadow-primary/10 cursor-pointer h-10 px-5 text-xs font-bold transition-all"
        >
          {mutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {mutation.isPending ? "Saving..." : "Save Record"}
        </Button>
      </div>
    </form>
  );
}

function NewRecordSuccessFeedback({
  record,
  onDismiss,
  onReset,
}: {
  record: Record;
  onDismiss: () => void;
  onReset: () => void;
}) {
  if (!record) return null;

  return (
    <SuccessFeedback
      title="Record Saved Successfully"
      description={
        <>
          Transaction{" "}
          <span className="font-mono font-medium text-emerald-600 dark:text-emerald-300 ml-1">
            #{record.id}
          </span>{" "}
          has been recorded successfully.
        </>
      }
      details={[
        {
          label: "Date",
          value: formatDate(record.date),
        },
        {
          label: "Type",
          value: (
            <span
              className={cn(
                "font-bold font-mono inline-flex w-fit text-xs",
                record.transaction_type === "OUT"
                  ? "text-rose-600 dark:text-rose-300"
                  : "text-emerald-600 dark:text-emerald-300",
              )}
            >
              {record.transaction_type}
            </span>
          ),
        },
        {
          label: "Total Items",
          value: (
            <span className="font-bold text-foreground">{record.total}</span>
          ),
        },
      ]}
      primaryAction={{
        to: "/records/$recordId",
        params: { recordId: record.id.toString() },
        label: "View Record Details",
        icon: FileText,
      }}
      secondaryAction={{
        onClick: onReset,
        label: "Create Another Record",
        icon: Plus,
      }}
      onDismiss={onDismiss}
    />
  );
}

function RecordLoadingSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-muted" />
          <Skeleton className="h-4 w-32 bg-muted/60" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 bg-muted" />
          <Skeleton className="h-9 w-28 bg-muted" />
        </div>
      </div>
      <div className="flex items-center justify-between bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full bg-muted" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-muted" />
            <Skeleton className="h-3 w-48 bg-muted/65" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full bg-muted" />
      </div>
      <Card className="bg-card border border-border">
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-40 bg-muted" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16 bg-muted/65" />
                <Skeleton className="h-10 w-full bg-muted" />
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-border">
            <Skeleton className="h-3 w-48 bg-muted/65 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-muted/65" />
                  <Skeleton className="h-10 w-full bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
