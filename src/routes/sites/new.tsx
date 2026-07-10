import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Route as rootRoute } from "@/routes/__root";
import {
  ArrowLeft,
  LayoutList,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  X,
  MapPin,
  Phone,
  PhoneCall,
  User,
  ShieldCheck,
  IndianRupee,
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
  getSizesForPart,
  PART_OPTIONS,
  STANDARD_RATES_SETUP,
} from "@/schemas/common";
import { customerService } from "@/services/customerService";
import { siteService } from "@/services/siteService";
import { createRoute, Link, useNavigate } from "@tanstack/react-router";
import { siteRateSchema, type Site } from "@/schemas/siteSchema";

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

  // If no customer is passed, we should ideally ask them to select one, but for now we'll just redirect to customers
  useEffect(() => {
    if (!customer) {
      navigate({ to: "/customers" });
    }
  }, [customer, navigate]);

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

  if (!customer) return null;

  return (
    <div className="flex-1 px-2 py-6 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative">
      <div className="relative z-10 space-y-6 sm:space-y-8">
        <Header customerName={customer.name} />

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
    </div>
  );
}

// --- Sub-components ---

function Header({ customerName }: { customerName: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <MapPin className="h-5 w-5 text-blue-50" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-zinc-100 to-zinc-400">
            New Site
          </h2>
          <Badge
            variant="outline"
            className="border-blue-500/30 text-blue-400 bg-blue-500/10 px-2 py-0.5"
          >
            {customerName}
          </Badge>
        </div>
        <p className="text-zinc-400/80 max-w-xl text-sm md:text-base font-medium">
          Register a new project site and configure its standard rental rates.
        </p>
      </div>
      <Button
        variant="outline"
        asChild
        className="hidden sm:flex border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white backdrop-blur-md transition-all shadow-sm"
      >
        <Link to="/sites">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sites
        </Link>
      </Button>
    </div>
  );
}

function SiteDetailsForm({ form, customer }: { form: any; customer: any }) {
  return (
    <Card className="bg-zinc-950/60 border-zinc-800/60 shadow-2xl backdrop-blur-xl relative overflow-hidden rounded-2xl">
      <CardHeader className="p-4 border-b border-zinc-800/40 bg-zinc-900/20">
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

function SiteRatesForm({ form }: { form: any }) {
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
                Note: Changing rates later will also affect previously stored bills.
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
