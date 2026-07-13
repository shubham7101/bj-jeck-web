import { useForm, useStore } from "@tanstack/react-form";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  IndianRupee,
  LayoutList,
  Loader2,
  MapPin,
  Phone,
  PhoneCall,
  Plus,
  RefreshCcw,
  Save,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { CustomerDataGrid } from "@/components/CustomerDataGrid";
import { ErrorAlert } from "@/components/ErrorAlert";
import { SuccessFeedback } from "@/components/SuccessFeedback";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Route as rootRoute } from "@/routes/__root";
import {
  getSizesForPart,
  PART_OPTIONS,
  STANDARD_RATES_SETUP,
} from "@/schemas/common";
import type { Customer } from "@/schemas/customerSchema";
import { type Site, siteRateSchema } from "@/schemas/siteSchema";
import { customerService } from "@/services/customerService";
import { siteService } from "@/services/siteService";
import { getInitials } from "@/utils";

const newSiteSearchSchema = z.object({
  customer_id: z.number().optional(),
});

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sites/new",
  validateSearch: (search) => newSiteSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ customer_id: search.customer_id }),
  loader: async ({ deps: { customer_id } }) => {
    if (!customer_id) return { customer: null };
    try {
      const customer = await customerService.get(customer_id);
      return { customer };
    } catch (_e) {
      return { customer: null };
    }
  },
  component: NewSitePage,
});

// --- Schema Definitions ---

const createSiteWithRatesSchema = z.object({
  contractor_name: z.string().min(2).max(100),
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
  rates: z.array(siteRateSchema).min(5),
});
type CreateSiteWithRates = z.infer<typeof createSiteWithRatesSchema>;

const EMPTY_RATE = { part: "full", size: "2.0", rate: 0 };

const DEFAULT_VALUES: CreateSiteWithRates = {
  contractor_name: "",
  mobile_no: "",
  mobile_no_2: "",
  address: "",
  rates: STANDARD_RATES_SETUP,
};

// --- Main Page Component ---

function NewSitePage() {
  const navigate = useNavigate();
  const { customer } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const successRef = useRef<HTMLDivElement>(null);
  const [createdSite, setCreatedSite] = useState<Site | null>(null);

  const handleCustomerSelect = (selected: Customer) => {
    navigate({
      to: "/sites/new",
      search: { customer_id: selected.id },
    });
  };

  const handleChangeCustomer = () => {
    navigate({
      to: "/sites/new",
      search: { customer_id: undefined },
    });
  };

  const mutation = useMutation({
    mutationFn: async (data: CreateSiteWithRates) => {
      if (!customer) throw new Error("No customer selected");
      const siteReq = {
        customer_id: customer.id,
        contractor_name: data.contractor_name,
        address: data.address,
        mobile_no: data.mobile_no,
        mobile_no_2: data.mobile_no_2 ?? undefined,
      };
      const site = await siteService.create(siteReq);

      const ratesReq = {
        rates: data.rates.map((r) => ({ ...r, rate: Number(r.rate) })),
      };
      await siteService.createRates(site.id, ratesReq);
      return site;
    },
    onSuccess: (data) => {
      setCreatedSite(data);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({
        queryKey: ["customers", customer?.id, "sites"],
      });
    },
  });

  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: {
      onSubmit: createSiteWithRatesSchema,
    },
    onSubmit: async ({ value }) => {
      if (createdSite) setCreatedSite(null);
      const payload = createSiteWithRatesSchema.parse(value);
      mutation.mutate(payload);
    },
  });

  useEffect(() => {
    if (createdSite && successRef.current) {
      const timer = setTimeout(() => {
        successRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [createdSite]);

  const handleReset = () => {
    form.reset();
    setCreatedSite(null);
    mutation.reset();
  };

  return (
    <div className="flex-1 w-full max-w-[100vw] lg:max-w-6xl lg:mx-auto px-2 py-4 sm:py-6 sm:p-6 md:p-8 space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24 overflow-x-hidden min-w-0">
      <div className="relative z-10 space-y-6 sm:space-y-8">
        <Header
          step={customer ? 2 : 1}
          hasCustomer={!!customer}
          onChangeCustomer={handleChangeCustomer}
        />

        {!customer ? (
          <CustomerSelectionStep onSelect={handleCustomerSelect} />
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {/* Customer Header Info */}
            <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-4">
                <Avatar className="h-9 w-9 border border-zinc-800">
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

            {mutation.isError && <ErrorAlert error={mutation.error} />}

            <form
              autoComplete="off"
              onSubmit={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await form.handleSubmit();
                setTimeout(() => {
                  const firstError = document.querySelector(
                    ".text-rose-400, [class*='border-rose-500']",
                  );
                  if (firstError) {
                    firstError.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                }, 100);
              }}
              className="flex flex-col gap-8 relative"
            >
              <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 items-start">
                <div className="space-y-6">
                  <SiteDetailsForm form={form} customer={customer} />
                </div>

                <div className="">
                  <SiteRatesForm form={form} />
                </div>
              </div>

              <FooterActions
                form={form}
                mutation={mutation}
                onReset={handleReset}
              />
            </form>

            {/* Success Notification */}
            {createdSite && (
              <div
                ref={successRef}
                className="pt-8 animate-in fade-in duration-500"
              >
                <NewSiteSuccessFeedback
                  site={createdSite}
                  onDismiss={() => setCreatedSite(null)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

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
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <MapPin className="h-5 w-5 text-blue-50" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-zinc-100 to-zinc-400">
            Create New Site
          </h2>
        </div>
        <p className="text-zinc-400/80 max-w-xl text-sm md:text-base font-medium">
          {step === 1
            ? "Step 1: Select a Master Customer"
            : "Step 2: Site Details"}
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
          <Link to="/sites">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sites
          </Link>
        </Button>
      </div>
    </div>
  );
}

function SiteDetailsForm({ form, customer }: { form: any; customer: any }) {
  return (
    <Card className="bg-zinc-950/60 border-zinc-800/60 shadow-2xl backdrop-blur-xl relative overflow-hidden rounded-2xl">
      <CardHeader className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center text-xl font-bold text-zinc-100 tracking-tight">
              <MapPin className="mr-2.5 h-5 w-5 text-blue-400" />
              Site Information
            </CardTitle>
            <CardDescription className="text-zinc-500 mt-1">
              Essential details for the project location.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              form.setFieldValue("contractor_name", customer.name);
              form.setFieldValue("mobile_no", customer.mobile_no);
              if (customer.mobile_no_2) {
                form.setFieldValue("mobile_no_2", customer.mobile_no_2);
              }
            }}
            className="border-zinc-700 bg-zinc-950/50 hover:bg-blue-950/30 hover:text-blue-400 hover:border-blue-500/50 transition-all font-medium h-9"
          >
            <User className="mr-2 h-3.5 w-3.5" /> Use Master Info
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:p-4 space-y-5 mt-2">
        <FormFieldWrapper
          form={form}
          name="contractor_name"
          label="Contractor Name"
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
          name="address"
          label="Address"
          icon={MapPin}
          required
          placeholder="Site, Area, City"
        />
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
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors pointer-events-none">
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
                    : "border-zinc-800 focus:border-blue-500 focus:ring-blue-500/20 hover:border-zinc-700"
                } transition-all duration-300 placeholder:text-sm placeholder:text-zinc-600 ${type === "numeric" ? "font-mono" : ""}`}
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

function SiteRatesForm({ form }: { form: any }) {
  const formValues = useStore(form.store, (state: any) => state.values);
  const formRates = formValues.rates || [];

  return (
    <Card className="bg-zinc-950/60 border-zinc-800/60 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col h-full min-h-[500px] rounded-2xl">
      <form.Field name="rates" mode="array">
        {(field: any) => (
          <>
            <CardHeader className="px-3 py-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:pb-5">
              <div className="space-y-1.5">
                <CardTitle className="text-xl flex items-center gap-2.5 font-bold text-zinc-100 tracking-tight">
                  <LayoutList className="h-5 w-5 text-blue-400" />
                  Inventory Rental Rates
                </CardTitle>
                <CardDescription className="text-zinc-500">
                  Configure custom default pricing for this specific site.
                </CardDescription>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none h-9 border-zinc-700 bg-zinc-950/50 hover:bg-blue-950/30 hover:text-blue-400 hover:border-blue-500/50 transition-all font-medium"
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
                                  <SelectTrigger className="w-full h-10 border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 focus:bg-zinc-950 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner font-medium">
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
                                  <SelectTrigger className="w-full h-10 border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 focus:bg-zinc-950 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner font-medium">
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
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-blue-400 transition-colors pointer-events-none">
                                    <IndianRupee className="h-4 w-4" />
                                  </div>
                                  <Input
                                    type="number"
                                    step="0.05"
                                    min="0"
                                    className="h-10 pl-9 border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 focus:bg-zinc-950 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner font-mono text-blue-50 text-base"
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
                              className="h-9 w-9 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer rounded-lg"
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
                <span className="text-blue-400">
                  {field.state.value.length}
                </span>
              </span>
              <span className="hidden sm:inline italic opacity-80">
                Note: Changing rates later will also affect previously stored
                bills.
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
            <ShieldCheck className="h-4 w-4 mr-2 text-blue-500" />
            Ready to create site profile?
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
            Discard
          </Button>
          <form.Subscribe
            selector={(state: any) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]: any) => (
              <Button
                type="submit"
                size="default"
                disabled={!canSubmit || isSubmitting || mutation.isPending}
                className="flex-1 sm:flex-none cursor-pointer bg-linear-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-500/40 transition-all font-semibold h-11 px-8 rounded-xl border border-blue-400/20"
              >
                {isSubmitting || mutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                {isSubmitting || mutation.isPending ? "Saving..." : "Save Site"}
              </Button>
            )}
          />
        </div>
      </div>
    </div>
  );
}

function NewSiteSuccessFeedback({
  site,
  onDismiss,
}: {
  site: Site;
  onDismiss: () => void;
}) {
  return (
    <SuccessFeedback
      title="Site Created Successfully!"
      description={
        <span className="flex items-center gap-1.5 text-zinc-300 mt-1">
          Assigned ID:{" "}
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-400 border-blue-500/30 font-mono text-sm px-2"
          >
            #{site.id}
          </Badge>
        </span>
      }
      details={[
        {
          label: "Contractor Name",
          value: (
            <p className="font-semibold text-zinc-100 text-base">
              {site.contractor_name}
            </p>
          ),
        },
        {
          label: "Mobile",
          value: (
            <p className="font-semibold text-zinc-100 text-base font-mono">
              {site.mobile_no}
            </p>
          ),
        },
        {
          label: "Address",
          value: (
            <p className="font-medium text-zinc-300 text-base truncate">
              {site.address}
            </p>
          ),
        },
      ]}
      primaryAction={{
        to: "/sites/$siteId",
        params: { siteId: site.id.toString() },
        label: "View Site Dashboard",
        icon: MapPin,
      }}
      secondaryAction={{
        onClick: onDismiss,
        label: "Add Another Site",
        icon: Plus,
      }}
      onDismiss={onDismiss}
    />
  );
}

function CustomerSelectionStep({
  onSelect,
}: {
  onSelect: (customer: Customer) => void;
}) {
  const [filters, setFilters] = useState<{
    name: string;
    mobile_no: string;
  }>({
    name: "",
    mobile_no: "",
  });
  const debouncedFilters = useDebounce(filters, 500);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["customers", { ...debouncedFilters, page, perPage }],
    queryFn: () =>
      customerService.search({
        ...debouncedFilters,
        page,
        per_page: perPage,
      }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-zinc-100">
          Find Master Customer
        </h3>
        <p className="text-zinc-400">
          Search for an existing customer to associate with the new site.
        </p>
      </div>
      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl relative overflow-hidden min-w-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-emerald-500 to-emerald-400/50" />
        <CardContent className="p-2 sm:p-6 pt-4 sm:pt-6 min-w-0">
          <div className="min-w-0 w-full">
            <CustomerDataGrid
              data={data?.data || []}
              isLoading={isLoading}
              isPlaceholderData={isPlaceholderData}
              filterProps={{
                filters,
                onChange: (e) =>
                  setFilters((prev) => ({
                    ...prev,
                    [e.target.name]: e.target.value,
                  })),
                onReset: () => setFilters({ name: "", mobile_no: "" }),
              }}
              paginationProps={{
                currentPage: page,
                totalPages: data?.pagination.total_pages || 0,
                totalCount: data?.pagination.total_count || 0,
                perPage,
                onPageChange: setPage,
                onPerPageChange: () => {},
              }}
              onSelect={onSelect}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
