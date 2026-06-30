import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Contact,
  IndianRupee,
  LayoutList,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ErrorAlert } from "@/components/ErrorAlert";
import { FormBase } from "@/components/form/FormBase";
import { FormInput } from "@/components/form/FormInput";
import { useAppForm } from "@/components/form/hooks";
import { SuccessFeedback } from "@/components/SuccessFeedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type CreateCustomer,
  type Customer,
  createCustomerSchema,
  PART_OPTIONS,
  SIZE_OPTIONS,
  STANDARD_RATES_SETUP,
} from "@/schemas/customerSchema";
import { customerService } from "@/services/customerService";

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
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      {/* --- Header --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              New Customer
            </h2>
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
            >
              Setup
            </Badge>
          </div>
          <p className="text-zinc-400 max-w-xl">
            Register a new client and configure their specific rental rates.
          </p>
        </div>
        <Button
          variant="ghost"
          asChild
          className="hidden sm:flex hover:bg-zinc-800 text-zinc-400 hover:text-white"
        >
          <Link to="/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>
      </div>

      <Separator className="bg-zinc-800/50" />

      {mutation.isError && <ErrorAlert error={mutation.error} />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col gap-8 relative"
      >
        <div className="grid gap-8 grid-cols-1 xl:grid-cols-16 items-start">
          <div className="xl:col-span-7 space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-emerald-500 to-emerald-400/50" />
              <CardHeader className="pb-4 border-b border-zinc-800/50 bg-zinc-900/50">
                <CardTitle className="flex items-center text-lg font-medium text-zinc-100">
                  <Contact className="mr-2 h-5 w-5 text-emerald-500" />
                  Customer Details
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
                      className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 transition-colors"
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
                      className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 transition-colors font-mono"
                    />
                  )}
                </form.Field>
                <form.Field name="address">
                  {(field) => (
                    <FormInput
                      field={field}
                      label="Address"
                      placeholder="Site, Area, City"
                      className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 transition-colors"
                    />
                  )}
                </form.Field>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Rates */}
          <div className="xl:col-span-9">
            <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl backdrop-blur-sm overflow-hidden flex flex-col h-full min-h-125">
              <form.Field name="rates" mode="array">
                {(field) => (
                  <>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/50 bg-zinc-900/50 pb-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2 font-medium text-zinc-100">
                          <LayoutList className="mr-2 h-5 w-5 text-emerald-500" />
                          Rental Rates
                        </CardTitle>
                        <p className="text-sm text-zinc-400">
                          Configure default pricing for this specific customer.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {/* Standard Set Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-zinc-700 bg-zinc-950/50 hover:bg-emerald-950/30 hover:text-emerald-400 hover:border-emerald-500/50 transition-all font-medium"
                          onClick={() => field.setValue(STANDARD_RATES_SETUP)}
                        >
                          <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                          Standard Set
                        </Button>

                        {/* Add Rate Button */}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => field.pushValue(EMPTY_RATE)}
                          className="h-8 bg-zinc-100 text-zinc-900 hover:bg-white border-none font-medium transition-all"
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

                    <CardContent className="p-0 flex-1 overflow-x-auto">
                      <div className="min-w-[600px]">
                        <Table>
                          <TableHeader className="bg-zinc-950/50 border-b-zinc-800/50">
                            <TableRow className="border-none hover:bg-transparent">
                              <TableHead className="w-[35%] pl-6 h-11 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                                Item Type
                              </TableHead>
                              <TableHead className="w-[30%] h-11 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                                Specification
                              </TableHead>
                              <TableHead className="w-[25%] h-11 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                                Daily Rate (₹)
                              </TableHead>
                              <TableHead className="w-[10%] h-11"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-zinc-800/30">
                            {field.state.value.map((_, index) => (
                              <TableRow
                                key={index}
                                className="group hover:bg-zinc-800/20 border-zinc-800/30 transition-colors"
                              >
                                {/* Part Selection */}
                                <TableCell className="pl-6 py-3">
                                  <form.Field name={`rates[${index}].part`}>
                                    {(subField) => (
                                      <FormBase field={subField}>
                                        <Select
                                          value={subField.state.value}
                                          onValueChange={subField.handleChange}
                                        >
                                          <SelectTrigger className="h-10 border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-none font-medium">
                                            <SelectValue placeholder="Select Part" />
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
                                <TableCell className="py-3 items-center">
                                  <form.Field name={`rates[${index}].size`}>
                                    {(subField) => (
                                      <FormBase field={subField}>
                                        <Select
                                          value={subField.state.value}
                                          onValueChange={subField.handleChange}
                                        >
                                          <SelectTrigger className="h-10 border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-none font-medium">
                                            <SelectValue placeholder="Select Size" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {SIZE_OPTIONS.map((size) => (
                                              <SelectItem
                                                key={size}
                                                value={size}
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

                                {/* Rate Input */}
                                <TableCell className="py-3">
                                  <form.Field name={`rates[${index}].rate`}>
                                    {(subField) => (
                                      <FormBase field={subField}>
                                        <div className="relative group/input">
                                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-emerald-500 transition-colors pointer-events-none">
                                            <IndianRupee className="h-3.5 w-3.5" />
                                          </div>
                                          <Input
                                            type="number"
                                            step="0.05"
                                            min="0"
                                            className="h-10 pl-8 border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-none font-mono text-emerald-100"
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
                                <TableCell className="py-3 text-right pr-4">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 opacity-40 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 cursor-pointer"
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
                      </div>
                    </CardContent>

                    <div className="p-4 border-t border-zinc-800/50 bg-zinc-950/40 flex justify-between items-center text-xs text-zinc-500">
                      <span className="font-medium bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                        Total Rates: {field.state.value.length}
                      </span>
                      <span className="hidden sm:inline">
                        Rates are automatically applied to daily billing.
                      </span>
                    </div>
                  </>
                )}
              </form.Field>
            </Card>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-4 z-40 mt-4 flex items-center justify-between gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-950/80 p-4 shadow-2xl backdrop-blur-xl sm:px-6">
          <div>
            <p className="hidden sm:block text-sm text-zinc-400">
              Please verify all details before saving.
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="ghost"
              type="button"
              onClick={handleReset}
              disabled={mutation.isPending}
              className="flex-1 sm:flex-none text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              Discard
            </Button>
            <Button
              type="submit"
              size="default"
              disabled={mutation.isPending}
              className="flex-1 sm:flex-none cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] transition-all font-medium min-w-[160px]"
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {mutation.isPending ? "Saving..." : "Save Customer"}
            </Button>
          </div>
        </div>
      </form>

      {/* Success Notification */}
      {createdCustomer && (
        <div ref={successRef}>
          <NewCustomerSuccessFeedback
            customer={createdCustomer}
            onDismiss={() => setCreatedCustomer(null)}
          />
        </div>
      )}
    </div>
  );
}

function NewCustomerSuccessFeedback({
  customer,
  onDismiss,
}: {
  customer: Customer;
  onDismiss: () => void;
}) {
  return (
    <SuccessFeedback
      title="Customer Created"
      description={
        <>
          ID: <span className="text-emerald-400 font-mono">#{customer.id}</span>
        </>
      }
      details={[
        {
          label: "Name",
          value: (
            <p className="font-medium text-emerald-50 text-base">
              {customer.name}
            </p>
          ),
        },
        {
          label: "Mobile",
          value: (
            <p className="font-medium text-emerald-50 text-base font-mono">
              {customer.mobile_no}
            </p>
          ),
        },
        {
          label: "Address",
          value: (
            <p className="font-medium text-emerald-50 text-base truncate">
              {customer.address}
            </p>
          ),
        },
      ]}
      primaryAction={{
        to: "/customers/$customerId",
        params: { customerId: customer.id.toString() },
        label: "View Profile",
        icon: User,
      }}
      secondaryAction={{
        onClick: onDismiss,
        label: "Add Another",
        icon: Plus,
      }}
      onDismiss={onDismiss}
    />
  );
}
