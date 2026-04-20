import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format, isValid, parse } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Calendar as CalendarIcon,
  FileText,
  Hash,
  Loader2,
  Plus,
  Save,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { CustomerDataGrid } from "@/components/CustomerDataGrid";
import { FormBase } from "@/components/form/FormBase";
import { useAppForm } from "@/components/form/hooks";
import { SuccessFeedback } from "@/components/SuccessFeedback";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
import {
  type Customer,
  PART_OPTIONS,
  SIZE_OPTIONS,
} from "@/schemas/customerSchema";
import {
  type CreateRecord,
  createRecordSchema,
  type Record,
} from "@/schemas/recordSchema";
import { customerService } from "@/services/customerService";
import { recordService } from "@/services/recordService";
import { formatDate, getInitials } from "@/utils";

// --- Route Definition ---

const recordSearchSchema = z.object({
  customer_id: z.number().optional(),
});

export const Route = createFileRoute("/records/new")({
  component: NewRecordPage,
  validateSearch: (search) => recordSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ customer_id: search.customer_id }),
  loader: async ({ deps: { customer_id } }) => {
    if (!customer_id) return { customer: null };
    try {
      const customer = await customerService.get(customer_id);
      return { customer };
    } catch (_e) {
      // If ID is invalid, return null so we can show selection screen
      return { customer: null };
    }
  },
  pendingComponent: RecordLoadingSkeleton,
});

// --- Constants ---
const DATE_FORMAT = "dd-MM-yyyy";

const DEFAULT_FORM_VALUES: Partial<CreateRecord> = {
  customer_id: 0,
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
      service_charge: 0,
    },
  ],
};

// --- Main Component ---

export default function NewRecordPage() {
  const navigate = useNavigate();
  const { customer } = Route.useLoaderData();
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

  const handleCustomerSelect = (selected: Customer) => {
    navigate({
      to: "/records/new",
      search: { customer_id: selected.id },
    });
  };

  const handleChangeCustomer = () => {
    setCreatedRecord(null);
    navigate({
      to: "/records/new",
      search: { customer_id: undefined },
    });
  };

  return (
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      <Header
        step={customer ? 2 : 1}
        hasCustomer={!!customer}
        onChangeCustomer={handleChangeCustomer}
      />

      {!customer ? (
        <CustomerSelectionStep onSelect={handleCustomerSelect} />
      ) : (
        <RecordEntryForm
          customer={customer}
          onSuccess={setCreatedRecord}
          onReset={() => setCreatedRecord(null)}
        />
      )}

      {createdRecord && (
        <div ref={successRef}>
          <NewRecordSuccessFeedback
            record={createdRecord}
            onDismiss={() => setCreatedRecord(null)}
            onReset={() => setCreatedRecord(null)}
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          New Record
        </h2>
        <p className="text-zinc-400">
          {step === 1 ? "Step 1: Select a Customer" : "Step 2: Enter Details"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {hasCustomer && (
          <Button
            variant="outline"
            onClick={onChangeCustomer}
            className="hidden sm:flex cursor-pointer border-zinc-700 bg-zinc-950/50 hover:bg-zinc-800 text-zinc-300"
          >
            <User className="mr-2 h-4 w-4" /> Change Customer
          </Button>
        )}
        <Button
          variant="ghost"
          asChild
          className="hidden sm:flex hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
        >
          <Link to="/records">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Link>
        </Button>
      </div>
    </div>
  );
}

function CustomerSelectionStep({
  onSelect,
}: {
  onSelect: (c: Customer) => void;
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
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
    <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl relative overflow-hidden animate-in fade-in duration-500">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400/50" />
      <CardHeader className="border-b border-zinc-800/50 bg-zinc-900/50">
        <CardTitle>Find Customer</CardTitle>
        <CardDescription>
          Search for an existing customer to generate a bill for.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
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

function RecordEntryForm({
  customer,
  onSuccess,
  onReset,
}: {
  customer: Customer;
  onSuccess: (data: Record) => void;
  onReset: () => void;
}) {
  const queryClient = useQueryClient();

  const form = useAppForm({
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      customer_id: customer.id,
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
      // 1. Notify parent to show success message
      onSuccess(data);

      // 2. Reset the form immediately to default values
      form.reset({
        ...DEFAULT_FORM_VALUES,
        customer_id: customer.id,
      } as CreateRecord);

      // 3. Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({ queryKey: ["customers", customer.id] });
    },
  });

  // Manual reset handler (used by the Reset Button)
  const handleResetForm = () => {
    form.reset({
      ...DEFAULT_FORM_VALUES,
      customer_id: customer.id,
    } as CreateRecord);
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
          <span
            className={cn(
              "mr-1.5 h-1.5 w-1.5 rounded-full",
              customer.active ? "bg-emerald-500 animate-pulse" : "bg-zinc-500",
            )}
          />
          {customer.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {mutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {mutation.error.message || "Failed to create record."}
          </AlertDescription>
        </Alert>
      )}

      {/* Transaction Details */}
      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400/50" />
        <CardHeader className="pb-4 border-b border-zinc-800/50 bg-zinc-900/50">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Hash className="h-4 w-4 text-emerald-500" />
            Record Details
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form.Field name="id">
              {(field) => (
                <FormBase field={field} label="Record ID">
                  <div className="relative">
                    <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      id={field.name}
                      type="number"
                      placeholder="Chalan No."
                      className="pl-9 bg-zinc-950/50 border-zinc-700 font-bold text-lg focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
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
                  <FormBase field={field} label="Date">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-zinc-950/50 border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors",
                            !dateValue && "text-muted-foreground",
                          )}
                        >
                          {dateValue ? (
                            format(dateValue, DATE_FORMAT)
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

            <form.Field name="transaction_type">
              {(field) => (
                <FormBase field={field} label="Transaction Type">
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(val) =>
                      field.handleChange(val as "IN" | "OUT")
                    }
                    className="grid grid-cols-2 gap-4"
                  >
                    {["OUT", "IN"].map((type) => (
                      <div
                        key={type}
                        className={cn(
                          "flex items-center justify-center space-x-2 border border-zinc-800 rounded-md py-2 bg-zinc-950/30 hover:bg-zinc-900 transition-colors",
                          type === "OUT"
                            ? "has-data-[state=checked]:border-rose-500/50 has-data-[state=checked]:bg-rose-500/10"
                            : "has-data-[state=checked]:border-emerald-500/50 has-data-[state=checked]:bg-emerald-500/10",
                        )}
                      >
                        <RadioGroupItem
                          value={type}
                          id={`r-${type}`}
                          className={cn(
                            "border-zinc-600 cursor-pointer",
                            type === "OUT"
                              ? "text-rose-500"
                              : "text-emerald-500",
                          )}
                        />
                        <Label
                          htmlFor={`r-${type}`}
                          className={cn(
                            "cursor-pointer font-normal",
                            type === "OUT"
                              ? "text-rose-200"
                              : "text-emerald-200",
                          )}
                        >
                          {type}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormBase>
              )}
            </form.Field>
          </div>

          <div className="pt-2 border-t border-zinc-800/50">
            <Label className="text-zinc-500 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <Truck className="h-3 w-3" /> Transport Details (Optional)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form.Field name="vehicle_no">
                {(field) => (
                  <FormBase field={field} label="Vehicle Number">
                    <Input
                      id={field.name}
                      placeholder="e.g. GJ-05-AB-1234"
                      className="bg-zinc-950/50 border-zinc-700 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                      value={field.state.value || ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </FormBase>
                )}
              </form.Field>
              <form.Field name="vehicle_mobile_no">
                {(field) => (
                  <FormBase field={field} label="Driver Mobile">
                    <Input
                      id={field.name}
                      placeholder="e.g. 9876543210"
                      className="bg-zinc-950/50 border-zinc-700 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                      value={field.state.value || ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </FormBase>
                )}
              </form.Field>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-500 to-zinc-400/50" />
        <form.Field name="items" mode="array">
          {(field) => (
            <>
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800/50 bg-zinc-900/50">
                <div>
                  <CardTitle className="text-lg">Items List</CardTitle>
                  <CardDescription>
                    Details of inventory movement.
                  </CardDescription>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm font-medium text-rose-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    field.pushValue({
                      part: "full",
                      size: "2.0",
                      item_amount: 0,
                      broken_amount: 0,
                      service_charge: 0,
                    })
                  }
                  className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white cursor-pointer"
                >
                  <Plus className="mr-2 h-3 w-3" /> Add Item
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-zinc-950/50">
                    <TableRow className="border-zinc-800/80 hover:bg-transparent">
                      <TableHead className="w-[20%] pl-6 text-zinc-400 font-medium">
                        Part Type
                      </TableHead>
                      <TableHead className="w-[20%] text-zinc-400 font-medium">
                        Size
                      </TableHead>
                      <TableHead className="w-[20%] text-zinc-400 font-medium">
                        Quantity
                      </TableHead>
                      <TableHead className="w-[15%] text-zinc-400 font-medium text-center">
                        Broken?
                      </TableHead>
                      <TableHead className="w-[20%] text-zinc-400 font-medium text-center">
                        Service Charge
                      </TableHead>
                      <TableHead className="w-[10%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-zinc-800">
                    {field.state.value.map((_, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-zinc-900/40 border-zinc-800/80 group transition-colors"
                      >
                        <TableCell className="pl-6 py-3 align-top">
                          <form.Field name={`items[${index}].part`}>
                            {(subField) => (
                              <FormBase field={subField}>
                                <Select
                                  value={subField.state.value}
                                  onValueChange={(val) =>
                                    subField.handleChange(
                                      val as "full" | "inner" | "outer",
                                    )
                                  }
                                >
                                  <SelectTrigger className="border-zinc-800 bg-zinc-950/50 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors cursor-pointer">
                                    <SelectValue placeholder="Select Part" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PART_OPTIONS.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                        className="cursor-pointer"
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

                        <TableCell className="py-3 align-top">
                          <form.Field name={`items[${index}].size`}>
                            {(subField) => (
                              <FormBase field={subField}>
                                <Select
                                  value={subField.state.value}
                                  onValueChange={(val) =>
                                    subField.handleChange(val)
                                  }
                                >
                                  <SelectTrigger className="border-zinc-800 bg-zinc-950/50 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors cursor-pointer">
                                    <SelectValue placeholder="Size" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SIZE_OPTIONS.map((size) => (
                                      <SelectItem
                                        key={size}
                                        value={String(size)}
                                        className="cursor-pointer"
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

                        <TableCell className="py-3 align-top">
                          <form.Field name={`items[${index}].item_amount`}>
                            {(subField) => (
                              <FormBase field={subField}>
                                <Input
                                  type="number"
                                  className="border-zinc-800 bg-zinc-950/50 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
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

                        <TableCell className="py-3 align-middle text-center">
                          <form.Field name={`items[${index}].broken_amount`}>
                            {(subField) => (
                              <FormBase field={subField}>
                                <div className="flex justify-center">
                                  <Input
                                    type="number"
                                    className="border-zinc-800 bg-zinc-950/50 text-center focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                                    placeholder="0"
                                    value={
                                      subField.state.value === 0
                                        ? ""
                                        : subField.state.value
                                    }
                                    onChange={(e) => {
                                      const val = Number(e.target.value);

                                      // 1. Update the broken amount (this field)
                                      subField.handleChange(val);

                                      // 2. Auto-calculate service_charge (sibling field)
                                      // Logic: service_charge = broken * 100
                                      form.setFieldValue(
                                        `items[${index}].service_charge`,
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

                        <TableCell className="py-3 align-middle text-center">
                          <form.Field name={`items[${index}].service_charge`}>
                            {(subField) => (
                              <FormBase field={subField}>
                                <div className="relative flex items-center justify-center">
                                  <span className="absolute left-2 text-emerald-500/70 text-xs font-medium">
                                    ₹
                                  </span>
                                  <Input
                                    type="number"
                                    className="pl-6 bg-zinc-950/80 border-emerald-500/30 text-emerald-400 text-center focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
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

                        <TableCell className="py-3 align-middle text-right pr-6">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-600 hover:text-rose-500 hover:bg-rose-950/20 opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => field.removeValue(index)}
                            disabled={field.state.value.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="bg-zinc-800" />

                <div className="bg-zinc-950/30 p-6 flex flex-col md:flex-row justify-end items-end gap-6">
                  <div className="w-full md:w-48">
                    <form.Field name="labour_charge">
                      {(field) => (
                        <FormBase field={field} label="Labour Charge">
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-zinc-500">
                              ₹
                            </span>
                            <Input
                              type="number"
                              placeholder="0"
                              className="pl-7 bg-zinc-950/50 border-emerald-500/50 text-emerald-400 font-bold text-lg h-10 shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)] focus:ring-emerald-500/50 transition-all"
                              value={
                                field.state.value === 0 ? "" : field.state.value
                              }
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
                  <div className="w-full md:w-48">
                    <form.Field name="transport_charge">
                      {(field) => (
                        <FormBase field={field} label="Transport Charge">
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-zinc-500">
                              ₹
                            </span>
                            <Input
                              type="number"
                              placeholder="0"
                              className="pl-7 bg-zinc-950/50 border-purple-500/50 text-purple-400 font-bold text-lg h-10 shadow-[0_0_15px_-3px_rgba(168,85,247,0.15)] focus:ring-purple-500/50 transition-all"
                              value={
                                field.state.value === 0 ? "" : field.state.value
                              }
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
                  <div className="w-full md:w-48">
                    <form.Field name="total">
                      {(field) => (
                        <FormBase field={field} label="Total Items">
                          <Input
                            type="number"
                            placeholder="0"
                            className="bg-zinc-950/50 border-zinc-700 font-bold text-lg h-10 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                            value={
                              field.state.value === 0 ? "" : field.state.value
                            }
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
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </form.Field>
      </Card>

      <div className="flex justify-end gap-4 pt-4 border-t border-zinc-800/50">
        <Button
          variant="ghost"
          type="button"
          onClick={handleResetForm}
          disabled={mutation.isPending}
          className="hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
        >
          Reset Form
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="min-w-40 bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-lg shadow-emerald-900/20 cursor-pointer"
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
  // If record is null (reset happened), don't render
  if (!record) return null;

  return (
    <SuccessFeedback
      title="Record Saved Successfully"
      description={
        <>
          Transaction{" "}
          <span className="font-mono font-medium text-emerald-300 ml-1">
            #{record.id}
          </span>{" "}
          has been recorded.
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
                "font-medium font-mono inline-flex w-fit",
                record.transaction_type === "OUT"
                  ? "text-rose-300"
                  : "text-emerald-300",
              )}
            >
              {record.transaction_type}
            </span>
          ),
        },
        {
          label: "Total Items",
          value: (
            <span className="font-bold text-emerald-100">{record.total}</span>
          ),
        },
      ]}
      primaryAction={{
        to: "/records/$recordId",
        params: { recordId: record.id.toString() },
        label: "View Record",
        icon: FileText,
      }}
      secondaryAction={{
        onClick: onReset,
        label: "Create Another",
        icon: Plus,
      }}
      onDismiss={onDismiss}
    />
  );
}

function RecordLoadingSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-zinc-800" />
          <Skeleton className="h-4 w-32 bg-zinc-800/60" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32 bg-zinc-800 hidden sm:block" />
          <Skeleton className="h-10 w-28 bg-zinc-800 hidden sm:block" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16 bg-zinc-800/60" />
                <Skeleton className="h-10 w-full bg-zinc-800" />
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-zinc-800/50">
            <Skeleton className="h-3 w-48 bg-zinc-800/60 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-zinc-800/60" />
                  <Skeleton className="h-10 w-full bg-zinc-800" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
