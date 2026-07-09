import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Route as rootRoute } from "@/routes/__root";
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
  CreditCard,
  MapPin,
  Phone,
  PhoneCall,
  UserPlus,
  ShieldCheck,
  UserX,
  RotateCcw,
  Activity,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { z } from "zod";

import { ErrorAlert } from "@/components/ErrorAlert";
import { SuccessFeedback } from "@/components/SuccessFeedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Customer, customerRateSchema } from "@/schemas/customerSchema";
import {
  getSizesForPart,
  PART_OPTIONS,
  STANDARD_RATES_SETUP,
} from "@/schemas/common";
import { customerService } from "@/services/customerService";
import { createRoute, Link, useRouter } from "@tanstack/react-router";

// --- Schema Definitions ---
const updateCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().min(3).max(255),
  mobile_no: z
    .string()
    .length(10, "Mobile number must be exactly 10 digits")
    .regex(/^\d+$/, "Mobile number must contain only digits"),
  mobile_no_2: z
    .string()
    .length(10, "Alternate mobile must be exactly 10 digits")
    .regex(/^\d+$/, "Alternate mobile must contain only digits")
    .or(z.literal(""))
    .nullish()
    .transform((val) => (val === "" ? null : val))
    .optional(),
  aadhar_card_no: z
    .string()
    .length(12, "Aadhar card must be exactly 12 digits")
    .regex(/^\d+$/, "Aadhar card must contain only digits")
    .or(z.literal(""))
    .nullish()
    .transform((val) => (val === "" ? null : val))
    .optional(),
  reference_name: z
    .string()
    .min(2, "Reference name must be at least 2 characters")
    .max(100, "Reference name must be at most 100 characters")
    .or(z.literal(""))
    .nullish()
    .transform((val) => (val === "" ? null : val))
    .optional(),
  active: z.boolean(),
  rates: z.array(customerRateSchema).min(5),
});

type UpdateCustomerPayload = z.infer<typeof updateCustomerSchema>;

const EMPTY_RATE = { part: "full", size: "2.0", rate: 0 };

// --- Route Definition ---
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers/update/$customerId",
  component: UpdateCustomerRouteWrapper,
  loader: async ({ params }) => {
    const id = Number(params.customerId);
    const [profile, rates] = await Promise.all([
      customerService.get(id),
      customerService.getRates(id).catch(() => null),
    ]);
    if (!profile) throw new Error("Customer not found");
    return {
      customerId: id,
      profile: {
        name: profile.name,
        mobile_no: profile.mobile_no,
        mobile_no_2: profile.mobile_no_2 || "",
        aadhar_card_no: profile.aadhar_card_no || "",
        reference_name: profile.reference_name || "",
        address: profile.address,
        active: profile.active,
      },
      rates: Array.isArray(rates) ? rates : [],
      lastUpdated: Date.now(),
    };
  },
  pendingComponent: LoadingSkeleton,
  errorComponent: ErrorState,
});

function UpdateCustomerRouteWrapper() {
  const { customerId, profile, rates, lastUpdated } = Route.useLoaderData();
  return (
    <UpdateCustomerPage
      key={lastUpdated}
      customerId={customerId}
      profile={profile}
      rates={rates}
    />
  );
}

// --- Main Page Component ---
function UpdateCustomerPage({ customerId, profile, rates }: any) {
  const queryClient = useQueryClient();
  const successRef = useRef<HTMLDivElement>(null);
  const [updatedCustomer, setUpdatedCustomer] = useState<Customer | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: UpdateCustomerPayload) => {
      const { rates: ratesData, ...profileData } = data;
      await Promise.all([
        customerService.update(customerId, profileData as any),
        customerService.updateRates(customerId, { rates: ratesData }),
      ]);
      return { id: customerId, ...profileData } as Customer;
    },
    onSuccess: (data) => {
      setUpdatedCustomer(data);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const form = useForm({
    defaultValues: {
      ...profile,
      rates: rates.length > 0 ? rates : STANDARD_RATES_SETUP,
    },
    validators: {
      onSubmit: updateCustomerSchema,
    },
    onSubmit: async ({ value }) => {
      if (updatedCustomer) setUpdatedCustomer(null);
      const payload = updateCustomerSchema.parse(value);
      mutation.mutate(payload);
    },
  });

  useEffect(() => {
    if (updatedCustomer && successRef.current) {
      const timer = setTimeout(() => {
        successRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [updatedCustomer]);

  return (
    <div className="flex-1 px-2 py-6 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative">
      <div className="relative z-10 space-y-6 sm:space-y-8">
        <Header customerId={customerId} />

        <Separator className="bg-zinc-800/50" />

        {mutation.isError && <ErrorAlert error={mutation.error} />}

        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col gap-8 relative"
        >
          <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 items-start">
            <div className="space-y-6">
              <CustomerDetailsForm form={form} />
            </div>
            <div className="">
              <CustomerRatesForm form={form} />
            </div>
          </div>

          <FooterActions
            form={form}
            mutation={mutation}
            onReset={() => form.reset()}
          />
        </form>

        {updatedCustomer && (
          <div
            ref={successRef}
            className="pt-8 animate-in fade-in duration-500"
          >
            <UpdateCustomerSuccessFeedback
              customer={updatedCustomer}
              onDismiss={() => setUpdatedCustomer(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function Header({ customerId }: { customerId: number }) {
  const router = useRouter();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <User className="h-5 w-5 text-emerald-50" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-zinc-100 to-zinc-400">
            Update Customer
          </h2>
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-2 py-0.5"
          >
            Edit Mode
          </Badge>
        </div>
        <p className="text-zinc-400/80 max-w-xl text-sm md:text-base font-medium">
          Manage profile details, configuration, and specific rental rates.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => router.invalidate()}
          className="hidden sm:flex hover:bg-zinc-800 text-zinc-400 hover:text-white"
          title="Reload Data"
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Refresh
        </Button>
        <Button
          variant="outline"
          asChild
          className="hidden sm:flex border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white backdrop-blur-md transition-all shadow-sm"
        >
          <Link
            to="/customers/$customerId"
            params={{ customerId: customerId.toString() }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Link>
        </Button>
      </div>
    </div>
  );
}

function CustomerDetailsForm({ form }: { form: any }) {
  return (
    <Card className="bg-zinc-950/60 border-zinc-800/60 shadow-2xl backdrop-blur-xl relative overflow-hidden rounded-2xl">
      <CardHeader className="p-4 border-b border-zinc-800/40 bg-zinc-900/20">
        <CardTitle className="flex items-center text-xl font-bold text-zinc-100 tracking-tight">
          <Contact className="mr-2.5 h-5 w-5 text-emerald-400" />
          Profile Details
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Essential contact and identification info.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:p-4 space-y-5">
        <FormFieldWrapper
          form={form}
          name="name"
          label="Full Name"
          icon={User}
          required
          placeholder="e.g. Rahul Sharma"
        />

        <FormFieldWrapper
          form={form}
          name="mobile_no"
          label="Primary Mobile"
          icon={Phone}
          required
          placeholder="10-digit number"
          type="numeric"
          maxLength={10}
        />
        <FormFieldWrapper
          form={form}
          name="mobile_no_2"
          label="Alternate Mobile"
          icon={PhoneCall}
          placeholder="Optional 10-digit number"
          type="numeric"
          maxLength={10}
        />

        <FormFieldWrapper
          form={form}
          name="aadhar_card_no"
          label="Aadhar Card No"
          icon={CreditCard}
          placeholder="Optional 12-digit number"
          type="numeric"
          maxLength={12}
        />

        <FormFieldWrapper
          form={form}
          name="reference_name"
          label="Reference Name"
          icon={UserPlus}
          placeholder="e.g. Recommended by..."
        />

        <FormFieldWrapper
          form={form}
          name="address"
          label="Address"
          icon={MapPin}
          required
          placeholder="Site, Area, City"
        />

        <Separator className="bg-zinc-800/50" />

        <form.Field name="active">
          {(field: any) => (
            <div className="flex flex-row items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 shadow-sm hover:border-zinc-700 transition-colors group">
              <div className="space-y-1">
                <Label
                  className="text-sm font-semibold flex items-center gap-2 cursor-pointer text-zinc-300"
                  htmlFor={`active-switch`}
                >
                  <Activity
                    className={`h-4 w-4 transition-colors ${field.state.value ? "text-emerald-500" : "text-zinc-500"}`}
                  />
                  Account Status
                </Label>
                <p className="text-xs text-zinc-500">
                  {field.state.value
                    ? "Customer is currently active."
                    : "Customer is inactive."}
                </p>
              </div>
              <Switch
                id={`active-switch`}
                checked={field.state.value}
                onCheckedChange={field.handleChange}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          )}
        </form.Field>
      </CardContent>
    </Card>
  );
}

function FormFieldWrapper({
  form,
  name,
  label,
  icon: Icon,
  required,
  placeholder,
  type = "text",
  maxLength,
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
            <div className="relative">
              {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                  <Icon className="h-4 w-4" />
                </div>
              )}
              <Input
                name={field.name}
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className={`bg-zinc-950/80 border h-11 shadow-inner ${Icon ? "pl-9" : ""} ${
                  hasError
                    ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20 hover:border-zinc-700"
                } transition-all duration-300 ${type === "numeric" ? "font-mono" : ""}`}
                placeholder={placeholder}
                inputMode={type === "numeric" ? "numeric" : "text"}
                maxLength={maxLength}
              />
            </div>
            {hasError && (
              <span className="text-rose-400 text-xs font-medium animate-in slide-in-from-top-1">
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

function CustomerRatesForm({ form }: { form: any }) {
  const formValues = useStore(form.store, (state: any) => state.values);
  const formRates = formValues.rates || [];

  return (
    <Card className="bg-zinc-950/60 border-zinc-800/60 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col h-full min-h-[500px] rounded-2xl">
      <form.Field name="rates" mode="array">
        {(field: any) => (
          <>
            <CardHeader className="px-3 py-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/40 bg-zinc-900/20 sm:pb-5">
              <div className="space-y-1.5">
                <CardTitle className="text-xl flex items-center gap-2.5 font-bold text-zinc-100 tracking-tight">
                  <LayoutList className="h-5 w-5 text-emerald-400" />
                  Inventory Rental Rates
                </CardTitle>
                <CardDescription className="text-zinc-500">
                  Configure custom default pricing for this specific customer.
                </CardDescription>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none h-9 border-zinc-700 bg-zinc-950/50 hover:bg-emerald-950/30 hover:text-emerald-400 hover:border-emerald-500/50 transition-all font-medium"
                  onClick={() => field.setValue(STANDARD_RATES_SETUP)}
                >
                  <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                  Standard Rates
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => field.pushValue(EMPTY_RATE)}
                  className="flex-1 sm:flex-none h-9 bg-zinc-100 text-zinc-900 hover:bg-white border-none font-medium transition-all shadow-sm"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Row
                </Button>
              </div>
            </CardHeader>

            {field.state.meta.errors.length > 0 && (
              <div className="bg-rose-950/30 px-6 py-3 border-b border-rose-900/30 backdrop-blur-sm">
                <p className="text-sm font-medium text-rose-400 flex items-center">
                  <X className="w-4 h-4 mr-2" />
                  {field.state.meta.errors.join(", ")}
                </p>
              </div>
            )}

            <CardContent className="p-0 flex-1 overflow-x-auto relative">
              <div className="w-full">
                <Table>
                  <TableHeader className="bg-zinc-950/80 border-b-zinc-800/50 sticky top-0 z-10 backdrop-blur-md">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="w-[35%] min-w-[150px] pl-6 h-12 text-xs uppercase tracking-wider text-zinc-500 font-bold">
                        Item Type
                      </TableHead>
                      <TableHead className="w-[30%] min-w-[130px] h-12 text-xs uppercase tracking-wider text-zinc-500 font-bold">
                        Specification
                      </TableHead>
                      <TableHead className="w-[25%] min-w-[140px] h-12 text-xs uppercase tracking-wider text-zinc-500 font-bold">
                        Daily Rate (₹)
                      </TableHead>
                      <TableHead className="w-[10%] min-w-[60px] h-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-zinc-800/30">
                    {field.state.value.map((_: any, index: number) => {
                      const rowPart = formRates[index]?.part || "full";
                      const allowedSizes = getSizesForPart(rowPart);

                      return (
                        <TableRow
                          key={index}
                          className="group hover:bg-zinc-800/20 border-zinc-800/30 transition-colors animate-in fade-in duration-300"
                        >
                          <TableCell className="pl-6 py-3.5">
                            <form.Field name={`rates[${index}].part`}>
                              {(subField: any) => (
                                <Select
                                  value={subField.state.value}
                                  onValueChange={(val) => {
                                    subField.handleChange(val);
                                    const defaultSize =
                                      val === "plate" ? "2x3" : "2.0";
                                    form.setFieldValue(
                                      `rates[${index}].size`,
                                      defaultSize,
                                    );
                                  }}
                                >
                                  <SelectTrigger className="w-full h-10 border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner font-medium">
                                    <SelectValue placeholder="Select Part" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-950 border-zinc-800">
                                    {PART_OPTIONS.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                        className="focus:bg-zinc-800"
                                      >
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </form.Field>
                          </TableCell>

                          <TableCell className="py-3.5 items-center">
                            <form.Field name={`rates[${index}].size`}>
                              {(subField: any) => (
                                <Select
                                  value={subField.state.value}
                                  onValueChange={subField.handleChange}
                                >
                                  <SelectTrigger className="w-full h-10 border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner font-medium">
                                    <SelectValue placeholder="Select Size" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-950 border-zinc-800">
                                    {allowedSizes.map((size) => (
                                      <SelectItem
                                        key={size}
                                        value={size}
                                        className="focus:bg-zinc-800"
                                      >
                                        {size}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </form.Field>
                          </TableCell>

                          <TableCell className="py-3.5">
                            <form.Field name={`rates[${index}].rate`}>
                              {(subField: any) => (
                                <div className="relative group/input">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-emerald-400 transition-colors pointer-events-none">
                                    <IndianRupee className="h-4 w-4" />
                                  </div>
                                  <Input
                                    type="number"
                                    step="0.05"
                                    min="0"
                                    className="h-10 pl-9 border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner font-mono text-emerald-50 text-base"
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
                              )}
                            </form.Field>
                          </TableCell>

                          <TableCell className="py-3.5 text-right pr-6">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 cursor-pointer rounded-lg"
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
            </CardContent>

            <div className="p-4 border-t border-zinc-800/40 bg-zinc-950/50 flex justify-between items-center text-xs text-zinc-400 backdrop-blur-md">
              <span className="font-semibold bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800/80 shadow-inner">
                Total Rates:{" "}
                <span className="text-emerald-400">
                  {field.state.value.length}
                </span>
              </span>
              <span className="hidden sm:inline italic opacity-80">
                Rates apply to new bills only.
              </span>
            </div>
          </>
        )}
      </form.Field>
    </Card>
  );
}

function FooterActions({
  form,
  mutation,
  onReset,
}: {
  form: any;
  mutation: any;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-end mt-2">
      <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4 sm:px-6">
        <div className="w-full sm:w-auto text-left">
          <p className="flex items-center text-sm font-medium text-zinc-400">
            <ShieldCheck className="h-4 w-4 mr-2 text-emerald-500" />
            Ready to save updates?
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="ghost"
            type="button"
            onClick={onReset}
            disabled={mutation.isPending}
            className="flex-1 sm:flex-none text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 font-medium h-11"
          >
            Discard Changes
          </Button>
          <form.Subscribe
            selector={(state: any) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]: any) => (
              <Button
                type="submit"
                size="default"
                disabled={!canSubmit || isSubmitting || mutation.isPending}
                className="flex-1 sm:flex-none cursor-pointer bg-linear-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/40 transition-all font-semibold h-11 px-8 rounded-xl border border-emerald-400/20"
              >
                {isSubmitting || mutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                {isSubmitting || mutation.isPending
                  ? "Saving..."
                  : "Save Updates"}
              </Button>
            )}
          />
        </div>
      </div>
    </div>
  );
}

function UpdateCustomerSuccessFeedback({
  customer,
  onDismiss,
}: {
  customer: Customer;
  onDismiss: () => void;
}) {
  return (
    <SuccessFeedback
      title="Customer Updated Successfully!"
      description={
        <span className="flex items-center gap-1.5 text-zinc-300 mt-1">
          Profile and rates for ID:{" "}
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono text-sm px-2"
          >
            #{customer.id}
          </Badge>
          have been saved.
        </span>
      }
      details={[
        {
          label: "Name",
          value: (
            <p className="font-semibold text-zinc-100 text-base">
              {customer.name}
            </p>
          ),
        },
        {
          label: "Mobile",
          value: (
            <p className="font-semibold text-zinc-100 text-base font-mono">
              {customer.mobile_no}
            </p>
          ),
        },
        {
          label: "Status",
          value: (
            <Badge
              variant="outline"
              className={
                customer.active
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
              }
            >
              {customer.active ? "Active" : "Inactive"}
            </Badge>
          ),
        },
      ]}
      primaryAction={{
        to: "/customers/$customerId",
        params: { customerId: customer.id.toString() },
        label: "Return to Profile",
        icon: User,
      }}
      secondaryAction={{
        onClick: onDismiss,
        label: "Continue Editing",
        icon: Plus,
      }}
      onDismiss={onDismiss}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 bg-zinc-800" />
          <Skeleton className="h-4 w-96 bg-zinc-800" />
        </div>
        <Skeleton className="h-10 w-32 bg-zinc-800" />
      </div>
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-12">
        <Skeleton className="lg:col-span-4 h-96 w-full bg-zinc-900 rounded-xl" />
        <Skeleton className="lg:col-span-8 h-96 w-full bg-zinc-900 rounded-xl" />
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  const router = useRouter();
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] space-y-6 p-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-center h-24 w-24 rounded-full bg-zinc-900 border border-zinc-800 shadow-xl">
        <UserX className="h-10 w-10 text-zinc-500" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Customer Load Failed
        </h2>
        <p className="text-zinc-400">
          {error.message || "We couldn't locate this customer."}
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => router.history.go(-1)}
        className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
      </Button>
    </div>
  );
}
