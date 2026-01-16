import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import {
  format,
  parse,
  isValid,
  parseISO,
  startOfDay,
  addDays,
  isAfter,
} from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Hash,
  Loader2,
  Save,
  User,
  AlertCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Plus,
  Receipt,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppForm } from "@/components/form/hooks";
import { FormBase } from "@/components/form/FormBase";
import { customerService } from "@/services/customerService";
import { billService } from "@/services/billService";
import { recordService } from "@/services/recordService";
import type { Customer } from "@/schemas/customerSchema";
import { useDebounce } from "@/hooks/use-debounce";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useStore } from "@tanstack/react-form";
import { CustomerDataGrid } from "@/components/CustomerDataGrid";
import { RecordTable } from "@/components/RecordDataGrid";
import { getInitials } from "@/utils";

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
  customer_id: z.number().optional(),
});

export const Route = createFileRoute("/bills/new")({
  component: NewBillPage,
  validateSearch: (search) => billSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ customer_id: search.customer_id }),
  loader: async ({ deps: { customer_id } }) => {
    if (!customer_id) return { customer: null };
    try {
      const customer = await customerService.get(customer_id);
      return { customer };
    } catch (e) {
      return { customer: null };
    }
  },
  pendingComponent: BillLoadingSkeleton,
});

// --- Main Component ---

export default function NewBillPage() {
  const navigate = useNavigate();
  const { customer } = Route.useLoaderData();

  const handleCustomerSelect = (selected: Customer) => {
    navigate({
      to: "/bills/new",
      search: { customer_id: selected.id },
    });
  };

  const handleChangeCustomer = () => {
    navigate({
      to: "/bills/new",
      search: { customer_id: undefined },
    });
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl mx-auto pb-20">
      <Header
        step={customer ? 2 : 1}
        hasCustomer={!!customer}
        onChangeCustomer={handleChangeCustomer}
      />

      {!customer ? (
        <CustomerSelectionStep onSelect={handleCustomerSelect} />
      ) : (
        <BillEntryForm customer={customer} />
      )}
    </div>
  );
}

function Header({
  step,
  hasCustomer,
  onChangeCustomer,
}: {
  step: number;
  hasCustomer: boolean;
  onChangeCustomer: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Create New Bill</h2>
        <p className="text-muted-foreground">
          {step === 1 ? "Step 1: Select a Customer" : "Step 2: Bill Details"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {hasCustomer && (
          <Button
            variant="outline"
            onClick={onChangeCustomer}
            className="hidden sm:flex cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" /> Change Customer
          </Button>
        )}
        <Button
          variant="outline"
          asChild
          className="hidden sm:flex cursor-pointer"
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
    address: "",
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
    setFilters({ name: "", mobile_no: "", address: "" });
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
    <Card className="bg-zinc-900/50 border-zinc-800 animate-in fade-in duration-500">
      <CardHeader>
        <CardTitle>Find Customer</CardTitle>
        <CardDescription>
          Search for an existing customer to generate a bill for.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CustomerDataGrid
          data={data?.data || []}
          isLoading={isLoading}
          isPlaceholderData={isPlaceholderData}
          navigate={mockNavigate as any}
          processingIds={new Set()}
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
          onDelete={undefined}
          onToggleStatus={undefined}
        />
      </CardContent>
    </Card>
  );
}

// --- Step 2: Bill Entry ---

function BillEntryForm({ customer }: { customer: Customer }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [maxToDate, setMaxToDate] = useState<Date | null>(null);
  const [successBill, setSuccessBill] = useState<any | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Bill Params Mutation (Fetch initial dates)
  const billParamsMutation = useMutation({
    mutationFn: (customerId: number) => billService.billParams(customerId),
    onSuccess: (data) => {
      const safeFromDate = parseDateSafe(data.from_date);
      const safeToDate = parseDateSafe(data.to_date);

      form.setFieldValue(
        "from_date",
        safeFromDate ? format(safeFromDate, DATE_FORMAT) : ""
      );

      setMaxToDate(safeToDate);

      form.setFieldValue(
        "to_date",
        safeToDate ? format(safeToDate, DATE_FORMAT) : ""
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
        queryKey: ["records", customer.id],
      });
      setSuccessBill(data);
    },
  });

  // Load params on mount
  useEffect(() => {
    if (customer.id && !successBill) {
      billParamsMutation.mutate(customer.id);
    }
  }, [customer.id, successBill]);

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
  const form = useAppForm({
    defaultValues: {
      bill_id: "" as number | "",
      customer_id: customer.id,
      from_date: "",
      to_date: "",
      khata_no: "",
    },
    onSubmit: async ({ value }) => {
      createBillMutation.mutate({
        id: Number(value.bill_id),
        customer_id: value.customer_id,
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
    form.setFieldValue("customer_id", customer.id);
    // Fetch fresh params for the next bill
    billParamsMutation.mutate(customer.id);
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
      customer.id,
      fromDateVal,
      toDateVal,
      page,
      perPage,
    ],
    queryFn: () =>
      recordService.search({
        customer_id: customer.id,
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

  // Derived Constraints
  const minToDate = parsedFrom ? addDays(parsedFrom, 1) : new Date();
  const defaultMonth = parsedFrom || new Date();

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      {/* Customer Header Info */}
      <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-9 w-9 border border-zinc-800">
            <AvatarImage
              src={customer.avatar || undefined}
              alt={customer.name}
            />
            <AvatarFallback className="bg-zinc-800 text-xs text-zinc-300">
              {getInitials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">
              {customer.name}
            </h4>
            <p className="text-xs text-zinc-400">
              ID: #{customer.id} • {customer.mobile_no}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "pl-2 pr-2.5 py-1 rounded-full border",
            customer.active
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-zinc-800 text-zinc-400 border-zinc-700"
          )}
        >
          {customer.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="space-y-2">
        {(billParamsMutation.isError || createBillMutation.isError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {billParamsMutation.error?.message ||
                createBillMutation.error?.message ||
                "An error occurred."}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Hash className="h-4 w-4 text-emerald-500" />
              Bill Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              {/* Bill ID */}
              <form.Field
                name="bill_id"
                validators={{
                  onChange: z.number().min(1, "Bill ID is required"),
                }}
              >
                {(field) => (
                  <FormBase
                    field={field}
                    label={
                      <span className="flex gap-1">
                        Bill ID <span className="text-rose-500">*</span>
                      </span>
                    }
                  >
                    <div className="relative">
                      <Hash className="absolute left-2.5 top-3 h-4 w-4 text-zinc-500" />
                      <Input
                        id={field.name}
                        type="number"
                        placeholder="e.g. 101"
                        className="pl-9 bg-zinc-950/50 border-zinc-700 font-bold text-lg"
                        value={field.state.value || ""}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        autoFocus
                        disabled={!!successBill}
                      />
                    </div>
                  </FormBase>
                )}
              </form.Field>

              {/* From Date (Read Only) */}
              <form.Field name="from_date">
                {(field) => (
                  <FormBase field={field} label="From Date (Fixed)">
                    <div className="relative">
                      <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                      <div className="h-10 pl-9 py-2 rounded-md border border-zinc-800 bg-zinc-950/30 text-zinc-400 text-sm flex items-center cursor-not-allowed">
                        {billParamsMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          field.state.value || "Loading..."
                        )}
                      </div>
                    </div>
                  </FormBase>
                )}
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
                    if (maxToDate && isAfter(current, maxToDate)) {
                      return `Max date: ${format(maxToDate, DATE_FORMAT)}`;
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <FormBase
                    field={field}
                    label={
                      <span className="flex gap-1">
                        To Date <span className="text-rose-500">*</span>
                      </span>
                    }
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={
                            !parsedFrom ||
                            billParamsMutation.isPending ||
                            !!successBill
                          }
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-zinc-950/50 border-zinc-700 hover:bg-zinc-900",
                            !field.state.value && "text-muted-foreground",
                            field.state.meta.errors.length > 0 &&
                              "border-rose-500 text-rose-500"
                          )}
                        >
                          {field.state.value ? (
                            field.state.value
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-zinc-900 border-zinc-800"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          defaultMonth={defaultMonth}
                          selected={
                            parseDateSafe(field.state.value) || undefined
                          }
                          onSelect={(date) => {
                            if (date)
                              field.handleChange(format(date, DATE_FORMAT));
                          }}
                          disabled={(date) => {
                            if (date < minToDate) return true;
                            if (maxToDate && isAfter(date, maxToDate))
                              return true;
                            return false;
                          }}
                          initialFocus
                          className="text-zinc-100"
                        />
                      </PopoverContent>
                    </Popover>
                  </FormBase>
                )}
              </form.Field>

              {/* Khata No */}
              <form.Field name="khata_no">
                {(field) => (
                  <FormBase field={field} label="Khata No (Optional)">
                    <Input
                      id={field.name}
                      placeholder="e.g. 3 12"
                      className="bg-zinc-950/50 border-zinc-700"
                      value={field.state.value || ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={!!successBill}
                    />
                  </FormBase>
                )}
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

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl overflow-hidden">
            <RecordTable
              data={filteredRecords}
              isLoading={isRecordsLoading}
              navigate={navigate}
              onDelete={undefined}
            />

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
                      Math.min(recordsData.pagination.total_pages, p + 1)
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
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
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
          <BillSuccessFeedback
            bill={successBill}
            onDismiss={() => navigate({ to: "/bills" })}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
}

function BillSuccessFeedback({
  bill,
  onDismiss,
  onReset,
}: {
  bill: any;
  onDismiss: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <Card className="border-emerald-500/30 bg-emerald-950/10 relative overflow-hidden shadow-lg shadow-emerald-900/10">
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-emerald-600 hover:text-emerald-400 hover:bg-emerald-900/30 cursor-pointer"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close notification</span>
          </Button>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <CardTitle className="text-xl text-emerald-500">
              Bill Generated Successfully
            </CardTitle>
          </div>
          <CardDescription className="text-emerald-400/80">
            Invoice{" "}
            <span className="font-mono font-medium text-emerald-300 ml-1">
              #{bill.id}
            </span>{" "}
            has been created and saved.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm bg-black/20 p-4 rounded-md border border-emerald-500/10">
            <div className="flex flex-col gap-1">
              <span className="text-emerald-500/70 text-xs uppercase font-semibold">
                Billing Period
              </span>
              <span className="font-medium text-emerald-100 flex items-center gap-1">
                {format(new Date(bill.from_date), "dd MMM")} -{" "}
                {format(new Date(bill.to_date), "dd MMM yyyy")}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-emerald-500/70 text-xs uppercase font-semibold">
                Khata No
              </span>
              <span className="font-medium text-emerald-100 font-mono">
                {bill.khata_no || "N/A"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-emerald-500/70 text-xs uppercase font-semibold">
                Total Amount
              </span>
              <span className="font-bold text-emerald-100 flex items-center">
                <IndianRupee className="h-3 w-3 mr-0.5" />
                {bill.total.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-emerald-950/30 py-4 flex gap-3">
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-500 text-white border-none cursor-pointer"
          >
            <Link to="/bills/$billId" params={{ billId: bill.id.toString() }}>
              <Receipt className="mr-2 h-4 w-4" />
              View Bill Details
            </Link>
          </Button>
          <Button
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300 cursor-pointer"
            onClick={onReset}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Bill
          </Button>
        </CardFooter>
      </Card>
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
