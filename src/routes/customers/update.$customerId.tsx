import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRoute, Link, useRouter } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Contact,
  IndianRupee,
  LayoutList,
  Loader2,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Trash2,
  UserX,
  X,
} from "lucide-react";
import { useState } from "react";
import { ErrorAlert } from "@/components/ErrorAlert";
import { FormBase } from "@/components/form/FormBase";
import { FormInput } from "@/components/form/FormInput";
import { useAppForm } from "@/components/form/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  type CustomerRate,
  PART_OPTIONS,
  SIZE_OPTIONS,
  STANDARD_RATES_SETUP,
  type UpdateCustomer,
  updateCustomerSchema,
} from "@/schemas/customerSchema";
import { customerService } from "@/services/customerService";

// --- Route Definition ---
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers/update/$customerId",
  component: UpdateCustomerRouteWrapper, // 1. Point to the wrapper
  loader: async ({ params }) => {
    const id = Number(params.customerId);

    // Fetch Profile and Rates
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
        address: profile.address,
        active: profile.active,
      } as UpdateCustomer,
      rates: Array.isArray(rates) ? rates : [],
      // 2. Add a timestamp here to force updates
      lastUpdated: Date.now(),
    };
  },
  pendingComponent: LoadingSkeleton,
  errorComponent: ErrorState,
});

const EMPTY_RATE = { part: "full", size: "2.0", rate: 0 };

// --- 3. Wrapper Component (Handles the Key/Reset) ---
function UpdateCustomerRouteWrapper() {
  const { customerId, profile, rates, lastUpdated } = Route.useLoaderData();

  return (
    // The 'key' prop forces React to destroy and recreate the form component
    // whenever the loader data is refreshed (lastUpdated changes).
    <UpdateCustomerForm
      key={lastUpdated}
      customerId={customerId}
      profile={profile}
      rates={rates}
    />
  );
}

// --- 4. Main Form Component (Logic Moved Here) ---
interface UpdateCustomerFormProps {
  customerId: number;
  profile: UpdateCustomer;
  rates: CustomerRate[];
}

function UpdateCustomerForm({
  customerId,
  profile,
  rates,
}: UpdateCustomerFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- Profile Mutation ---
  const [profileSuccess, setProfileSuccess] = useState(false);
  const profileMutation = useMutation({
    mutationFn: (data: UpdateCustomer) =>
      customerService.update(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
      router.invalidate();
    },
  });

  const profileForm = useAppForm({
    defaultValues: profile,
    validators: { onSubmit: updateCustomerSchema },
    onSubmit: async ({ value }) => {
      await profileMutation.mutateAsync(value);
    },
  });

  // --- Rates Mutation ---
  const [ratesSuccess, setRatesSuccess] = useState(false);
  const ratesMutation = useMutation({
    mutationFn: (data: { rates: CustomerRate[] }) =>
      customerService.updateRates(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setRatesSuccess(true);
      setTimeout(() => setRatesSuccess(false), 3000);
      router.invalidate();
    },
  });

  const ratesForm = useAppForm({
    defaultValues: { rates: rates },
    onSubmit: async ({ value }) => {
      await ratesMutation.mutateAsync(value);
    },
  });

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      {/* --- Header --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Update Customer
            </h2>
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
            >
              Edit Mode
            </Badge>
          </div>
          <p className="text-zinc-400 max-w-xl">
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
            className="hover:bg-zinc-800 text-zinc-300 border-zinc-700"
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

      <Separator className="bg-zinc-800/50" />

      <div className="grid gap-8 grid-cols-1 xl:grid-cols-16 items-start">
        <div className="xl:col-span-7 space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl backdrop-blur-sm relative overflow-hidden">
            {/* Subtle Emerald Top Accent for Profile Form to match NewCustomerPage */}
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-emerald-500 to-emerald-400/50" />

            <CardHeader className="pb-4 border-b border-zinc-800/50 bg-zinc-900/50">
              <CardTitle className="flex items-center text-lg font-medium text-zinc-100">
                <Contact className="mr-2 h-5 w-5 text-emerald-500" />
                Profile Details
              </CardTitle>
            </CardHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                profileForm.handleSubmit();
              }}
            >
              <CardContent className="space-y-5 pt-6">
                {profileMutation.isError && (
                  <ErrorAlert error={profileMutation.error} />
                )}
                {profileSuccess && <SuccessBanner message="Profile updated" />}

                <profileForm.Field name="name">
                  {(field) => (
                    <FormInput
                      field={field}
                      label="Full Name"
                      placeholder="e.g. Rahul Sharma"
                      className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 transition-colors"
                    />
                  )}
                </profileForm.Field>
                <profileForm.Field name="mobile_no">
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
                </profileForm.Field>
                <profileForm.Field name="address">
                  {(field) => (
                    <FormInput
                      field={field}
                      label="Address"
                      placeholder="Site, Area, City"
                      className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 transition-colors"
                    />
                  )}
                </profileForm.Field>

                <Separator className="bg-zinc-800/50" />

                <profileForm.Field name="active">
                  {(field) => (
                    <div className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/30 p-3 shadow-sm hover:border-zinc-700 transition-colors">
                      <div className="space-y-0.5">
                        <Label
                          className="text-base flex items-center gap-2 cursor-pointer"
                          htmlFor={`active-switch-${customerId}`}
                        >
                          <Activity
                            className={`h-4 w-4 ${field.state.value ? "text-emerald-500" : "text-zinc-500"}`}
                          />
                          Status
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {field.state.value
                            ? "Customer is active"
                            : "Customer is inactive"}
                        </p>
                      </div>
                      <Switch
                        id={`active-switch-${customerId}`}
                        checked={field.state.value}
                        onCheckedChange={field.handleChange}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </div>
                  )}
                </profileForm.Field>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={profileMutation.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] transition-all"
                  >
                    {profileMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>

        <div className="xl:col-span-9">
          <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl backdrop-blur-sm overflow-hidden flex flex-col h-full min-h-125">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                ratesForm.handleSubmit();
              }}
              className="flex flex-col h-full"
            >
              <ratesForm.Field name="rates" mode="array">
                {(field) => (
                  <>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/50 bg-zinc-900/50 pb-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2 font-medium text-zinc-100">
                          <LayoutList className="mr-2 h-5 w-5 text-emerald-500" />
                          Rental Rates
                        </CardTitle>
                        <p className="text-sm text-zinc-400">
                          Configure daily pricing.
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
                          Reset Standard
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

                    {ratesMutation.isError && (
                      <div className="p-4 pb-0">
                        <ErrorAlert error={ratesMutation.error} />
                      </div>
                    )}
                    {ratesSuccess && (
                      <div className="p-4 pb-0">
                        <SuccessBanner message="Rates Configuration Saved" />
                      </div>
                    )}

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
                                Part Type
                              </TableHead>
                              <TableHead className="w-[30%] h-11 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                                Size
                              </TableHead>
                              <TableHead className="w-[25%] h-11 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                                Rate / Day
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
                                  <ratesForm.Field
                                    name={`rates[${index}].part`}
                                  >
                                    {(subField) => (
                                      <FormBase field={subField}>
                                        <Select
                                          value={subField.state.value}
                                          onValueChange={subField.handleChange}
                                        >
                                          <SelectTrigger className="h-10 border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-none font-medium">
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
                                  </ratesForm.Field>
                                </TableCell>

                                {/* Size Selection */}
                                <TableCell className="py-3">
                                  <ratesForm.Field
                                    name={`rates[${index}].size`}
                                  >
                                    {(subField) => (
                                      <FormBase field={subField}>
                                        <Select
                                          value={subField.state.value}
                                          onValueChange={subField.handleChange}
                                        >
                                          <SelectTrigger className="h-10 border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-none font-medium">
                                            <SelectValue placeholder="Size" />
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
                                  </ratesForm.Field>
                                </TableCell>

                                {/* Rate Input */}
                                <TableCell className="py-3">
                                  <ratesForm.Field
                                    name={`rates[${index}].rate`}
                                  >
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
                                            className="h-10 pl-8 border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-none font-mono font-medium rounded-md"
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
                                  </ratesForm.Field>
                                </TableCell>

                                {/* Delete Action */}
                                <TableCell className="py-3 text-right pr-4">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100"
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

                    <div className="p-4 border-t border-zinc-800/50 bg-zinc-950/30 flex justify-between items-center rounded-b-xl">
                      <span className="text-xs text-zinc-500 italic pl-2">
                        Updates apply to future billing only.
                      </span>
                      <Button
                        type="submit"
                        variant="secondary"
                        disabled={ratesMutation.isPending}
                        className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors shadow-sm"
                      >
                        {ratesMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Update Rates
                      </Button>
                    </div>
                  </>
                )}
              </ratesForm.Field>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]">
      <CheckCircle2 className="h-4 w-4" />
      <span className="text-sm font-medium">{message}</span>
    </div>
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
