import { useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import { format, isValid, parse } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  FileText,
  Hash,
  History,
  Loader2,
  Plus,
  Save,
  Trash2,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

// --- Constants ---
const DATE_FORMAT = "dd-MM-yyyy";

// --- Route Definition ---
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/records/update/$recordId",
  component: UpdateRecordPage,
  loader: async ({ params: { recordId } }) => {
    const record = await recordService.get(Number(recordId));
    const customer = await customerService.get(record.customer_id);
    return { record, customer };
  },
  pendingComponent: RecordLoadingSkeleton,
});

export default function UpdateRecordPage() {
  const { record, customer } = Route.useLoaderData() as {
    record: Record;
    customer: Customer;
  };
  const [updatedRecord, setUpdatedRecord] = useState<Record | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (updatedRecord && successRef.current) {
      setTimeout(() => {
        successRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [updatedRecord]);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            Update Record
          </h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-500" />
            Modify details and items for transaction{" "}
            <Link
              to={"/records/$recordId"}
              params={{ recordId: record.id.toString() }}
              className="text-emerald-500 hover:text-emerald-400 cursor-pointer"
            >
              #{record.id}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            asChild
            className="hidden sm:flex cursor-pointer"
          >
            <Link to="/records">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
            </Link>
          </Button>
        </div>
      </div>

      <RecordUpdateForm
        record={record}
        customer={customer}
        onSuccess={setUpdatedRecord}
      />

      {updatedRecord && (
        <div ref={successRef}>
          <UpdatedRecordSuccessFeedback
            record={updatedRecord}
            onDismiss={() => setUpdatedRecord(null)}
          />
        </div>
      )}
    </div>
  );
}

function RecordUpdateForm({
  record,
  customer,
  onSuccess,
}: {
  record: Record;
  customer: Customer;
  onSuccess: (data: Record) => void;
}) {
  const queryClient = useQueryClient();
  const [showTransport, setShowTransport] = useState(
    !!record.vehicle_no || !!record.vehicle_mobile_no,
  );

  const form = useAppForm({
    defaultValues: {
      ...record,
      date: record.date ? format(new Date(record.date), DATE_FORMAT) : "",
    } as CreateRecord,
    validators: {
      onSubmit: createRecordSchema,
    },
    onSubmit: async ({ value }) => {
      const { bill_id: _bill_id, ...restOfRecord } = value as any;

      const cleanedData = {
        ...restOfRecord,
        items: value.items.map(({ id, ...itemRest }: any) => itemRest),
      };
      mutation.mutate(cleanedData);
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateRecord) => recordService.update(record.id, data),
    onSuccess: (data) => {
      onSuccess(data as Record);
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({ queryKey: ["records", record.id] });
    },
  });

  const handleResetForm = () => {
    form.reset(record as CreateRecord);
    mutation.reset();
  };

  // Subscribe to react-form store values reactively to do totals calculations
  const formValues = useStore(form.store, (state: any) => state.values);
  const items = formValues.items || [];

  const calculatedTotalItems = items.reduce(
    (acc: number, item: any) =>
      acc +
      (item.part === "full" || item.part === "plate"
        ? (item.item_amount || 0) + (item.broken_amount || 0)
        : 0),
    0,
  );
  const calculatedBrokenQty = items.reduce(
    (acc: number, item: any) => acc + (item.broken_amount || 0),
    0,
  );
  const calculatedBrokenCharges = items.reduce(
    (acc: number, item: any) => acc + (item.broken_charge || 0),
    0,
  );
  const calculatedServiceCharges = items.reduce(
    (acc: number, item: any) => acc + (item.service_charge || 0),
    0,
  );
  const calculatedLostCharges = items.reduce(
    (acc: number, item: any) => acc + (item.lost_charge || 0),
    0,
  );

  const calculatedLabourCharge = items.reduce((acc: number, item: any) => {
    const totalQty = (item.item_amount || 0) + (item.broken_amount || 0);
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

  const grandTotalAmount =
    calculatedBrokenCharges +
    calculatedServiceCharges +
    calculatedLostCharges +
    (formValues.labour_charge || 0) +
    (formValues.transport_charge || 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6 animate-in slide-in-from-right-4 duration-300"
    >
      {/* Customer Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl shadow-md gap-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-inner">
            <AvatarImage
              src={customer.avatar || undefined}
              alt={customer.name}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {getInitials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-zinc-100 hover:underline">
                <Link
                  to="/customers/$customerId"
                  params={{ customerId: customer.id.toString() }}
                >
                  {customer.name}
                </Link>
              </h4>
              <Badge
                variant="outline"
                className={cn(
                  "pl-1.5 pr-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wider uppercase",
                  customer.active
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700",
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 h-1.5 w-1.5 rounded-full",
                    customer.active
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-zinc-500",
                  )}
                />
                {customer.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-zinc-200">
                ID: #{customer.id}
              </span>
              <span>•</span>
              <span>{customer.mobile_no}</span>
              <span>•</span>
              <span className="italic">{customer.address}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm"
          >
            Updating Record #{record.id}
          </Badge>
        </div>
      </div>

      {mutation.isError && <ErrorAlert error={mutation.error} />}

      {/* Transaction Details */}
      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl relative overflow-hidden rounded-xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary to-primary/50" />
        <CardHeader className="pb-4 border-b border-zinc-800/50 bg-zinc-900/50">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-100">
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
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                      id={field.name}
                      type="number"
                      disabled
                      placeholder="Chalan Number"
                      className="pl-9 bg-zinc-950/50 border-zinc-800 text-zinc-400 opacity-70 font-bold text-lg h-10"
                      value={field.state.value || ""}
                    />
                  </div>
                </FormBase>
              )}
            </form.Field>

            <form.Field name="date">
              {(field) => {
                const rawValue = field.state.value;
                let dateValue: Date | undefined;

                if (rawValue) {
                  const parsedISO = new Date(rawValue);
                  if (isValid(parsedISO)) {
                    dateValue = parsedISO;
                  } else {
                    const parsedCustom = parse(
                      rawValue,
                      DATE_FORMAT,
                      new Date(),
                    );
                    if (isValid(parsedCustom)) dateValue = parsedCustom;
                  }
                }

                return (
                  <FormBase field={field} label="Transaction Date">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-zinc-950/50 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200 focus:border-primary/50 focus:ring-primary/20 transition-all h-10",
                            !dateValue && "text-muted-foreground",
                          )}
                        >
                          {dateValue ? (
                            format(dateValue, DATE_FORMAT)
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 text-zinc-500" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-zinc-900 border-zinc-800 shadow-lg rounded-xl"
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
                  <div className="relative flex p-1 bg-zinc-950/60 border border-zinc-800 rounded-lg w-full h-10 items-center">
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
                          ? "text-rose-600 dark:text-rose-455"
                          : "text-zinc-400 hover:text-zinc-200",
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
                          : "text-zinc-400 hover:text-zinc-200",
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

          <div className="pt-4 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setShowTransport(!showTransport)}
              className="flex items-center justify-between w-full py-2 hover:text-zinc-250 text-zinc-400 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary group-hover:animate-bounce" />
                <span className="text-xs font-bold tracking-wider uppercase text-zinc-200">
                  Transport & Driver details
                </span>
                <span className="text-[10px] font-normal text-zinc-400 px-2 py-0.5 bg-zinc-950 rounded-full ml-2">
                  Optional
                </span>
              </div>
              {showTransport ? (
                <ChevronUp className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
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
                        className="bg-zinc-950/50 border-zinc-800 focus:border-primary/50 focus:ring-primary/20 transition-all font-mono"
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
                        className="bg-zinc-950/50 border-zinc-800 focus:border-primary/50 focus:ring-primary/20 transition-all font-mono"
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
      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl flex flex-col relative overflow-hidden rounded-xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-zinc-500 to-zinc-400/50" />
        <form.Field name="items" mode="array">
          {(field) => (
            <>
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800/50 bg-zinc-900/50">
                <div>
                  <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Items List
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Details of inventory movement.
                  </CardDescription>
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
                    <TableHeader className="bg-zinc-950/40">
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
                        <TableHead className="w-[14%] text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
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
                    <TableBody className="divide-y divide-zinc-800/60">
                      {field.state.value.map((_, index) => {
                        const rowPart = items[index]?.part;
                        const allowedSizes =
                          rowPart === "full" ||
                          rowPart === "inner" ||
                          rowPart === "outer"
                            ? ["1.5", "2.0", "2.5", "3.0"]
                            : [
                                "1x3",
                                "2x3",
                                "9x3",
                                "12x3",
                                "15x3",
                                "18x3",
                                "21x3",
                              ];
                        return (
                        <TableRow
                          key={index}
                          className="hover:bg-zinc-950/20 border-zinc-800/40 group transition-colors"
                        >
                          <TableCell className="pl-6 py-3.5 align-top">
                            <form.Field name={`items[${index}].part`}>
                              {(subField) => (
                                <FormBase field={subField} className="mb-0">
                                  <Select
                                    value={subField.state.value}
                                    onValueChange={(val) => {
                                      subField.handleChange(
                                        val as "full" | "inner" | "outer" | "plate",
                                      );
                                      const defaultSize = val === "plate" ? "2x3" : "2.0";
                                      form.setFieldValue(`items[${index}].size`, defaultSize);
                                    }}
                                  >
                                    <SelectTrigger className="border-zinc-850 bg-zinc-950/50 hover:bg-zinc-900/50 focus:border-primary/50 focus:ring-primary/20 transition-all cursor-pointer h-9 text-xs">
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
                                    <SelectTrigger className="border-zinc-850 bg-zinc-950/50 hover:bg-zinc-900/50 focus:border-primary/50 focus:ring-primary/20 transition-all cursor-pointer h-9 text-xs">
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
                            <form.Field name={`items[${index}].broken_amount`}>
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
                            <form.Field name={`items[${index}].broken_charge`}>
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
                            <form.Field name={`items[${index}].service_charge`}>
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
                              className="h-8 w-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 opacity-60 group-hover:opacity-100 transition-all cursor-pointer rounded-full"
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
                <div className="block md:hidden p-4 space-y-4 bg-zinc-950/20 border-t border-zinc-800">
                  {field.state.value.map((_, index) => {
                    const mobileRowPart = items[index]?.part;
                    const mobileAllowedSizes =
                      mobileRowPart === "full" ||
                      mobileRowPart === "inner" ||
                      mobileRowPart === "outer"
                        ? ["1.5", "2.0", "2.5", "3.0"]
                        : ["2x3", "9x3", "12x3", "15x3", "18x3", "21x3"];

                    return (
                    <div
                      key={index}
                      className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl relative space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                          Item #{index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all cursor-pointer"
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
                                    val as "full" | "inner" | "outer" | "plate",
                                  );
                                  const defaultSize = val === "plate" ? "2x3" : "2.0";
                                  form.setFieldValue(`items[${index}].size`, defaultSize);
                                }}
                              >
                                <SelectTrigger className="border-zinc-850 bg-zinc-950/50 h-9 text-xs">
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
                                <SelectTrigger className="border-zinc-850 bg-zinc-950/50 h-9 text-xs">
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

                      <div className="grid grid-cols-2 gap-4">
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
                                  subField.handleChange(Number(e.target.value))
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
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
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
      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl relative overflow-hidden rounded-xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-emerald-500/30 to-purple-500/30" />
        <CardHeader className="pb-4 border-b border-zinc-800/50 bg-zinc-900/50">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-100">
            <Wrench className="h-4 w-4 text-emerald-500" />
            Overrides & Additional Charges
          </CardTitle>
          <CardDescription className="text-zinc-400">
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
                    className="bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40 focus:border-primary/60 focus:ring-primary/20 transition-all font-bold text-base h-10 px-3 text-zinc-100"
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

      {/* Live Chalan Receipt Card */}
      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-md shadow-xl relative overflow-hidden rounded-xl">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-primary via-emerald-500 to-purple-500" />

        <CardHeader className="pb-4 border-b border-zinc-800/50 bg-zinc-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-100">
                <FileText className="h-4 w-4 text-primary animate-pulse" />
                Live Chalan Receipt
              </CardTitle>
              <CardDescription className="text-zinc-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Real-time calculations based on active form inputs
              </CardDescription>
            </div>
            <div className="text-left sm:text-right font-mono text-[10px] text-zinc-400 space-y-0.5">
              <div>
                Date: {formValues.date || format(new Date(), "dd-MM-yyyy")}
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

        <CardContent className="p-6 space-y-6">
          {/* 6-Column Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {/* 1. Total Quantity */}
            <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800 hover:border-primary/20 transition-all flex flex-col justify-between h-24 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Total Qty
                </span>
                <Hash className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <div className="text-lg font-black text-zinc-100">
                  {formValues.total || 0}
                </div>
                <div className="text-[9px] text-zinc-400">pieces</div>
              </div>
            </div>

            {/* 2. Labour Charge */}
            <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800 hover:border-emerald-500/20 transition-all flex flex-col justify-between h-24 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Labour
                </span>
                <Wrench className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="space-y-0.5">
                <div className="text-lg font-black text-emerald-400">
                  ₹{(formValues.labour_charge || 0).toLocaleString("en-IN")}
                </div>
                <div className="text-[9px] text-zinc-400">calculated</div>
              </div>
            </div>

            {/* 3. Transport Charge */}
            <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800 hover:border-purple-500/20 transition-all flex flex-col justify-between h-24 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Transport
                </span>
                <Truck className="h-4 w-4 text-purple-500" />
              </div>
              <div className="space-y-0.5">
                <div className="text-lg font-black text-purple-400">
                  ₹{(formValues.transport_charge || 0).toLocaleString("en-IN")}
                </div>
                <div className="text-[9px] text-zinc-400">additional</div>
              </div>
            </div>

            {/* 4. Broken Charge */}
            <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800 hover:border-rose-500/20 transition-all flex flex-col justify-between h-24 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Broken
                </span>
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-black text-rose-400 truncate">
                  ₹{calculatedBrokenCharges.toLocaleString("en-IN")}
                </div>
                <div className="text-[9px] text-zinc-450 font-semibold">
                  {calculatedBrokenQty} broken pcs
                </div>
              </div>
            </div>

            {/* 5. Service Charge */}
            <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800 hover:border-amber-500/20 transition-all flex flex-col justify-between h-24 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Service
                </span>
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
              <div className="space-y-0.5">
                <div className="text-lg font-black text-amber-400">
                  ₹{calculatedServiceCharges.toLocaleString("en-IN")}
                </div>
                <div className="text-[9px] text-zinc-400">maintenance</div>
              </div>
            </div>

            {/* 6. Lost Charge */}
            <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800 hover:border-rose-600/20 transition-all flex flex-col justify-between h-24 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Lost
                </span>
                <Trash2 className="h-4 w-4 text-rose-500" />
              </div>
              <div className="space-y-0.5">
                <div className="text-lg font-black text-rose-400">
                  ₹{calculatedLostCharges.toLocaleString("en-IN")}
                </div>
                <div className="text-[9px] text-zinc-400">missing items</div>
              </div>
            </div>
          </div>

          {/* Grand Total Area */}
          <div className="border-t-2 border-dashed border-zinc-800 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-950/20 p-4 rounded-xl">
            <div className="space-y-1 text-center sm:text-left">
              <span className="font-bold text-zinc-200 text-xs uppercase tracking-wider">
                Total Chalan Valuation
              </span>
              <p className="text-[10px] text-zinc-400">
                Sum of labour, transport, damages, lost and service charges
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="font-extrabold text-2xl text-primary tracking-tight">
                  ₹{grandTotalAmount.toLocaleString("en-IN")}
                </span>
                <span className="text-[9px] text-zinc-450 uppercase font-semibold">
                  dynamic estimation
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/50">
        <Button
          variant="ghost"
          type="button"
          onClick={handleResetForm}
          disabled={mutation.isPending}
          className="hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer h-10 px-4 text-xs font-semibold"
        >
          Reset Changes
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="min-w-40 bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-md shadow-emerald-950/10 cursor-pointer h-10 px-5 text-xs font-bold transition-all"
        >
          {mutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {mutation.isPending ? "Updating..." : "Update Record"}
        </Button>
      </div>
    </form>
  );
}

function UpdatedRecordSuccessFeedback({
  record,
  onDismiss,
}: {
  record: Record;
  onDismiss: () => void;
}) {
  return (
    <SuccessFeedback
      title="Record Updated Successfully"
      description={
        <>
          Transaction{" "}
          <span className="font-mono font-medium text-emerald-300 ml-1">
            #{record.id}
          </span>{" "}
          has been modified.
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
                "font-medium font-mono",
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
        label: "View Details",
        icon: FileText,
      }}
      secondaryAction={{
        to: "/records",
        label: "Back to List",
        icon: ArrowLeft,
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
        <Skeleton className="h-10 w-28 bg-zinc-800" />
      </div>
      <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-lg">
        <Skeleton className="h-10 w-full bg-zinc-800" />
      </div>
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-10">
          <Skeleton className="h-64 w-full bg-zinc-800" />
        </CardContent>
      </Card>
    </div>
  );
}
