import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { format, parse, isValid } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  IndianRupee,
  Loader2,
  Save,
  User,
  X,
  AlertCircle,
  Wallet,
  Receipt,
  Plus,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, getInitials } from "@/utils";
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
import { ledgerService } from "@/services/ledgerService";
import type { Customer } from "@/schemas/customerSchema";
import { useDebounce } from "@/hooks/use-debounce";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { CustomerDataGrid } from "@/components/CustomerDataGrid";
import {
  createLedgerSchema,
  type CreateLedger,
  type Ledger,
} from "@/schemas/ledgerSchema";

// --- Route Definition ---

const ledgerSearchSchema = z.object({
  customer_id: z.number().optional(),
});

export const Route = createFileRoute("/ledger/new")({
  component: NewLedgerPage,
  validateSearch: (search) => ledgerSearchSchema.parse(search),
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
  pendingComponent: LedgerLoadingSkeleton,
});

// --- Schemas & Constants ---

const DATE_FORMAT = "dd-MM-yyyy";

const DEFAULT_FORM_VALUES: Partial<CreateLedger> = {
  customer_id: 0,
  amount: 0,
  date: format(new Date(), DATE_FORMAT),
};

// --- Main Component ---

export default function NewLedgerPage() {
  const navigate = useNavigate();
  const { customer } = Route.useLoaderData();
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

  const handleCustomerSelect = (selected: Customer) => {
    navigate({
      to: "/ledger/new",
      search: { customer_id: selected.id },
    });
  };

  const handleChangeCustomer = () => {
    setCreatedEntry(null);
    setFormKey(0); // Reset key when changing customer
    navigate({
      to: "/ledger/new",
      search: { customer_id: undefined },
    });
  };

  // 2. Logic to handle "Add Another"
  const handleAddAnother = () => {
    setCreatedEntry(null); // Hide success message
    setFormKey((prev) => prev + 1); // Change key to unmount/remount form with default values
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto pb-20">
      <Header
        step={customer ? 2 : 1}
        hasCustomer={!!customer}
        onChangeCustomer={handleChangeCustomer}
      />

      {!customer ? (
        <CustomerSelectionStep onSelect={handleCustomerSelect} />
      ) : (
        <LedgerEntryForm
          key={formKey} // 3. Pass the key here
          customer={customer}
          onSuccess={setCreatedEntry}
          onReset={() => setCreatedEntry(null)}
        />
      )}

      {createdEntry && (
        <div ref={successRef}>
          <SuccessFeedback
            entry={createdEntry}
            onDismiss={() => setCreatedEntry(null)}
            onReset={handleAddAnother} // 4. Pass the new handler
          />
        </div>
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
        <h2 className="text-3xl font-bold tracking-tight">New Payment</h2>
        <p className="text-muted-foreground">
          {step === 1 ? "Step 1: Select Customer" : "Step 2: Payment Details"}
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
          <Link to="/ledger">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ledger
          </Link>
        </Button>
      </div>
    </div>
  );
}

// --- Step 1: Customer Selection (Reused) ---

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
          Select the customer who made the payment.
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

// --- Step 2: Form ---

function LedgerEntryForm({
  customer,
  onSuccess,
  onReset,
}: {
  customer: Customer;
  onSuccess: (data: any) => void;
  onReset: () => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateLedger) => ledgerService.create(data),
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["customers", customer.id] });
    },
  });

  const form = useAppForm({
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      customer_id: customer.id,
    } as CreateLedger,
    validators: {
      onSubmit: createLedgerSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });

  const handleResetForm = () => {
    form.reset({
      ...DEFAULT_FORM_VALUES,
      customer_id: customer.id,
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
      className="space-y-6 animate-in slide-in-from-right-4 duration-300"
    >
      <form.Field name="customer_id">
        {(field) => (
          <input type="hidden" name={field.name} value={field.state.value} />
        )}
      </form.Field>

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
            <h4 className="text-sm font-semibold text-zinc-100 hover:underline">
              <Link
                to="/customers/$customerId"
                params={{ customerId: customer.id.toString() }}
              >
                {customer.name}
              </Link>
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
              : "bg-zinc-800 text-zinc-400 border-zinc-700",
          )}
        >
          {customer.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {mutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {mutation.error.message || "Failed to create ledger entry."}
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            Transaction Details
          </CardTitle>
          <CardDescription>
            Record a cash or bank payment received from the customer.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
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
                      className="pl-10 h-14 bg-zinc-950/80 border-zinc-700 focus:border-emerald-500/50 text-2xl font-bold text-white placeholder:text-zinc-700"
                      value={field.state.value === 0 ? "" : field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value ? parseFloat(e.target.value) : 0,
                        )
                      }
                      onWheel={(e) => e.currentTarget.blur()}
                      autoFocus
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
                            "w-full h-14 pl-4 text-left font-normal bg-zinc-950/50 border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200",
                            !dateValue && "text-muted-foreground",
                          )}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                              Selected Date
                            </span>
                            <span className="text-lg text-zinc-200">
                              {dateValue
                                ? format(dateValue, "dd MMMM yyyy")
                                : "Pick a date"}
                            </span>
                          </div>
                          <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-zinc-900 border-zinc-800"
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
                          className="text-zinc-100"
                        />
                      </PopoverContent>
                    </Popover>
                  </FormBase>
                );
              }}
            </form.Field>
          </div>
        </CardContent>

        <CardFooter className="bg-zinc-950/30 border-t border-zinc-800 p-6 flex justify-end gap-4">
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
            className="min-w-48 bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-lg shadow-emerald-900/20 cursor-pointer"
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
    </form>
  );
}

// --- Success Feedback ---

function SuccessFeedback({
  entry,
  onDismiss,
  onReset,
}: {
  entry: Ledger;
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
              Payment Recorded
            </CardTitle>
          </div>
          <CardDescription className="text-emerald-400/80">
            The ledger has been updated successfully.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm bg-black/20 p-4 rounded-md border border-emerald-500/10 max-w-2xl">
            <div className="flex flex-col gap-1">
              <span className="text-emerald-500/70 text-xs uppercase font-semibold">
                Amount Received
              </span>
              <span className="font-bold text-2xl text-emerald-400 flex items-center">
                <IndianRupee className="h-5 w-5 mr-1" />
                {entry.amount?.toLocaleString() || "0"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-emerald-500/70 text-xs uppercase font-semibold">
                Transaction Date
              </span>
              <span className="font-medium text-emerald-100 text-lg">
                {formatDate(entry.date)}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-emerald-950/30 py-4 flex gap-3">
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-500 text-white border-none cursor-pointer"
          >
            <Link to="/ledger">
              <Receipt className="mr-2 h-4 w-4" />
              View Ledger
            </Link>
          </Button>
          <Button
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300 cursor-pointer"
            onClick={onReset}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another
          </Button>
        </CardFooter>
      </Card>
    </div>
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
