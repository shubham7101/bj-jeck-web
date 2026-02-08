import { useEffect, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  CheckCircle2,
  User,
  X,
  Loader2,
  ArrowLeft,
  Trash2,
  RefreshCcw,
  LayoutList,
  Contact,
  IndianRupee,
} from "lucide-react";
import { useAppForm } from "@/components/form/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormInput } from "@/components/form/FormInput";
import { customerService } from "@/services/customerService";
import {
  createCustomerSchema,
  PART_OPTIONS,
  SIZE_OPTIONS,
  STANDARD_RATES_SETUP,
  type CreateCustomer,
  type Customer,
} from "@/schemas/customerSchema";
import { ErrorAlert } from "@/components/ErrorAlert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormBase } from "@/components/form/FormBase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/customers/new")({
  component: NewCustomerPage,
});

// --- Constants ---

const EMPTY_RATE = { part: "full", size: "2.0", rate: 0 };

const DEFAULT_VALUES: CreateCustomer = {
  name: "",
  mobile_no: "",
  address: "",
  rates: STANDARD_RATES_SETUP,
};

// --- Components ---

function NewCustomerPage() {
  const queryClient = useQueryClient();
  const successRef = useRef<HTMLDivElement>(null);
  const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);

  const mutation = useMutation({
    mutationFn: (data: CreateCustomer) => customerService.create(data),
    onSuccess: (data) => {
      setCreatedCustomer(data);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validators: {
      onSubmit: createCustomerSchema,
    },
    onSubmit: async ({ value }) => {
      if (createdCustomer) setCreatedCustomer(null);
      mutation.mutate(value);
    },
  });

  useEffect(() => {
    if (createdCustomer && successRef.current) {
      const timer = setTimeout(() => {
        successRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [createdCustomer]);

  const handleReset = () => {
    form.reset();
    setCreatedCustomer(null);
    mutation.reset();
  };

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* --- Header --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
              New Customer
            </h2>
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400"
            >
              Beta
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-xl">
            Register a new client to the inventory tracking system.
          </p>
        </div>
        <Button
          variant="ghost"
          asChild
          className="hidden sm:flex hover:bg-zinc-800 text-zinc-400 hover:text-white"
        >
          <Link to="/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customer List
          </Link>
        </Button>
      </div>

      <Separator className="bg-zinc-800" />

      {mutation.isError && <ErrorAlert error={mutation.error} />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-8"
      >
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-12 items-start">
          <div className="lg:col-span-6 space-y-6">
            <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-zinc-800/50">
                <CardTitle className="flex items-center text-lg">
                  <Contact className="mr-2 h-5 w-5 text-emerald-500" />
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <form.Field name="name">
                  {(field) => (
                    <FormInput
                      field={field}
                      label="Full Name"
                      placeholder="e.g. Rahul Sharma"
                      autoFocus
                      className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50"
                    />
                  )}
                </form.Field>
                <form.Field name="mobile_no">
                  {(field) => (
                    <FormInput
                      field={field}
                      label="Mobile Number"
                      placeholder="10-digit number"
                      inputMode="numeric"
                      maxLength={10}
                      className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50"
                    />
                  )}
                </form.Field>
                <form.Field name="address">
                  {(field) => (
                    <FormInput
                      field={field}
                      label="Address"
                      placeholder="Site, Area, City"
                      className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50"
                    />
                  )}
                </form.Field>
              </CardContent>
            </Card>

            {/* Sticky Actions for Desktop */}
            <div className="hidden lg:flex flex-col gap-3 sticky top-6">
              <Button
                type="submit"
                size="lg"
                disabled={mutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] transition-all"
              >
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {mutation.isPending ? "Creating..." : "Create Customer"}
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={handleReset}
                disabled={mutation.isPending}
                className="w-full text-zinc-500 hover:text-zinc-200"
              >
                Reset Form
              </Button>
            </div>
          </div>
          <div className="lg:col-span-6">
            <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl backdrop-blur-sm overflow-hidden flex flex-col h-full min-h-125">
              <form.Field name="rates" mode="array">
                {(field) => (
                  <>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/50 bg-zinc-900/50 pb-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <LayoutList className="mr-2 h-5 w-5 text-emerald-500" />
                          Rental Rates
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Manage pricing configuration.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {/* Standard Set Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-zinc-700 bg-zinc-900/50 hover:bg-emerald-950/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                          onClick={() => field.setValue(STANDARD_RATES_SETUP)}
                        >
                          <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                          Standard
                        </Button>

                        {/* Add Rate Button */}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => field.pushValue(EMPTY_RATE)}
                          className="h-8 bg-zinc-100 text-zinc-900 hover:bg-white border-none"
                        >
                          <Plus className="mr-2 h-3.5 w-3.5" /> Add Row
                        </Button>
                      </div>
                    </CardHeader>

                    {/* Validation Error Message */}
                    {field.state.meta.errors.length > 0 && (
                      <div className="bg-rose-950/20 px-6 py-2 border-b border-rose-900/20">
                        <p className="text-sm font-medium text-rose-500 flex items-center">
                          <X className="w-3 h-3 mr-2" />
                          {field.state.meta.errors.join(", ")}
                        </p>
                      </div>
                    )}

                    <CardContent className="p-0 flex-1">
                      <Table>
                        <TableHeader className="bg-zinc-950/30">
                          <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="w-[35%] pl-6 h-10 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                              Part Type
                            </TableHead>
                            <TableHead className="w-[30%] h-10 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                              Size
                            </TableHead>
                            <TableHead className="w-[25%] h-10 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                              Rate / Day
                            </TableHead>
                            <TableHead className="w-[10%] h-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-zinc-800/50">
                          {field.state.value.map((_, index) => (
                            <TableRow
                              key={index}
                              className="group hover:bg-zinc-900/60 border-zinc-800/50 transition-colors"
                            >
                              {/* Part Selection */}
                              <TableCell className="pl-6 py-2">
                                <form.Field name={`rates[${index}].part`}>
                                  {(subField) => (
                                    <FormBase field={subField}>
                                      <Select
                                        value={subField.state.value}
                                        onValueChange={subField.handleChange}
                                      >
                                        <SelectTrigger className="h-9 border-transparent bg-transparent hover:bg-zinc-800/50 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-none">
                                          <SelectValue placeholder="Part" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {PART_OPTIONS.map((opt) => (
                                            <SelectItem
                                              key={opt.value}
                                              value={opt.value}
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

                              {/* Size Selection */}
                              <TableCell className="py-2">
                                <form.Field name={`rates[${index}].size`}>
                                  {(subField) => (
                                    <FormBase field={subField}>
                                      <Select
                                        value={subField.state.value}
                                        onValueChange={subField.handleChange}
                                      >
                                        <SelectTrigger className="h-9 border-transparent bg-transparent hover:bg-zinc-800/50 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-none">
                                          <SelectValue placeholder="Size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {SIZE_OPTIONS.map((size) => (
                                            <SelectItem key={size} value={size}>
                                              {size}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormBase>
                                  )}
                                </form.Field>
                              </TableCell>

                              {/* Rate Input */}
                              <TableCell className="py-2">
                                <form.Field name={`rates[${index}].rate`}>
                                  {(subField) => (
                                    <FormBase field={subField}>
                                      <div className="relative group/input">
                                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-emerald-500 transition-colors pointer-events-none">
                                          <IndianRupee className="h-3 w-3" />
                                        </div>
                                        <Input
                                          type="number"
                                          step="0.05"
                                          min="0"
                                          className="h-9 pl-7 border-transparent bg-transparent hover:bg-zinc-800/50 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-none font-mono"
                                          placeholder="0.00"
                                          value={subField.state.value || ""}
                                          onChange={(e) =>
                                            subField.handleChange(
                                              Number(e.target.value),
                                            )
                                          }
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </div>
                                    </FormBase>
                                  )}
                                </form.Field>
                              </TableCell>

                              {/* Delete Action */}
                              <TableCell className="py-2 text-right pr-4">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-600 hover:text-rose-400 hover:bg-rose-950/20 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
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
                    </CardContent>

                    <div className="p-4 border-t border-zinc-800 bg-zinc-950/20 flex justify-between items-center text-xs text-muted-foreground">
                      <span>Total Rates: {field.state.value.length}</span>
                      <span className="italic">
                        Rates are automatically applied to daily billing.
                      </span>
                    </div>
                  </>
                )}
              </form.Field>
            </Card>
          </div>

          {/* Mobile Action Buttons (Bottom) */}
          <div className="lg:hidden col-span-1 flex gap-3 pt-4">
            <Button
              variant="outline"
              type="button"
              onClick={handleReset}
              disabled={mutation.isPending}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {mutation.isPending ? "Creating..." : "Create Customer"}
            </Button>
          </div>
        </div>
      </form>

      {/* Success Notification */}
      {createdCustomer && (
        <div ref={successRef}>
          <SuccessFeedback
            customer={createdCustomer}
            onDismiss={() => setCreatedCustomer(null)}
          />
        </div>
      )}
    </div>
  );
}

function SuccessFeedback({
  customer,
  onDismiss,
}: {
  customer: Customer;
  onDismiss: () => void;
}) {
  return (
    <div className="mt-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      <Card className="border-emerald-500/30 bg-linear-to-br from-emerald-950/20 to-black relative overflow-hidden shadow-2xl shadow-emerald-900/10">
        {/* Decorative Background Blob */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-emerald-600 hover:text-emerald-400 hover:bg-emerald-900/30 rounded-full"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close notification</span>
          </Button>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-xl text-emerald-100">
                Customer Created
              </CardTitle>
              <CardDescription className="text-emerald-400/60">
                ID: #{customer.id} • {customer.active ? "Active" : "Inactive"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm bg-black/40 p-5 rounded-lg border border-emerald-500/10 backdrop-blur-md">
            <div className="space-y-1">
              <span className="text-emerald-500/50 text-[10px] uppercase tracking-wider font-bold">
                Name
              </span>
              <p className="font-medium text-emerald-50 text-base">
                {customer.name}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-emerald-500/50 text-[10px] uppercase tracking-wider font-bold">
                Mobile
              </span>
              <p className="font-medium text-emerald-50 text-base font-mono">
                {customer.mobile_no}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-emerald-500/50 text-[10px] uppercase tracking-wider font-bold">
                Address
              </span>
              <p className="font-medium text-emerald-50 text-base truncate">
                {customer.address}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-emerald-950/30 py-4 flex gap-3 border-t border-emerald-500/10">
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-lg shadow-emerald-900/20"
          >
            <Link
              to="/customers/$customerId"
              params={{ customerId: customer.id.toString() }}
            >
              <User className="mr-2 h-4 w-4" />
              View Profile
            </Link>
          </Button>
          <Button
            variant="outline"
            className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300 bg-transparent"
            onClick={onDismiss}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
