import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, isValid, parse } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Calendar as CalendarIcon,
  FileText,
  Hash,
  History,
  Loader2,
  Plus,
  Save,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
export const Route = createFileRoute("/records/update/$recordId")({
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
            <History className="h-4 w-4" /> Step 2: Modify Details for
            Transaction #{record.id}
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
          className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2.5 py-1 rounded-full"
        >
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Updating Record
        </Badge>
      </div>

      {mutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Update Failed</AlertTitle>
          <AlertDescription>{mutation.error.message}</AlertDescription>
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
                      disabled
                      className="pl-9 bg-zinc-950/50 border-zinc-700 opacity-70 font-bold text-lg"
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
                          field.state.value === type &&
                            (type === "OUT"
                              ? "border-rose-500/50 bg-rose-500/10"
                              : "border-emerald-500/50 bg-emerald-500/10"),
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
              <Truck className="h-3 w-3" /> Transport Details
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
                        className="hover:bg-zinc-900/30 border-zinc-800 group"
                      >
                        <TableCell className="pl-6 py-3 align-top">
                          <form.Field name={`items[${index}].part`}>
                            {(subField) => (
                              <FormBase field={subField}>
                                <Select
                                  value={subField.state.value as string}
                                  onValueChange={(val) =>
                                    subField.handleChange(val as any)
                                  }
                                >
                                  <SelectTrigger className="border-zinc-800 bg-zinc-950/50 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors cursor-pointer">
                                    <SelectValue />
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
                                    <SelectValue />
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
                                  placeholder="0"
                                  className="border-zinc-800 bg-transparent"
                                  value={subField.state.value || ""}
                                  onChange={(e) =>
                                    subField.handleChange(
                                      Number(e.target.value),
                                    )
                                  }
                                />
                              </FormBase>
                            )}
                          </form.Field>
                        </TableCell>

                        <TableCell className="py-3 align-middle text-center">
                          <form.Field name={`items[${index}].broken_amount`}>
                            {(subField) => (
                              <FormBase field={subField}>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  className="border-zinc-800 bg-transparent"
                                  value={subField.state.value || ""}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    subField.handleChange(val);
                                    form.setFieldValue(
                                      `items[${index}].service_charge`,
                                      val * 100,
                                    );
                                  }}
                                />
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
                                    value={subField.state.value || ""}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        Number(e.target.value),
                                      )
                                    }
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
                              value={field.state.value || ""}
                              onChange={(e) =>
                                field.handleChange(Number(e.target.value))
                              }
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
                            value={field.state.value || ""}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              field.handleChange(val);
                              form.setFieldValue(`labour_charge`, val * 3);
                            }}
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
          Reset Changes
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
