import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Contact,
  CreditCard,
  Loader2,
  Phone,
  PhoneCall,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Route as rootRoute } from "@/routes/__root";
import type { Customer } from "@/schemas/customerSchema";
import { customerService } from "@/services/customerService";

// --- Schema Definitions ---
export const updateCustomerSchema = z.object({
  name: z.string().min(2).max(100),
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
});
export type UpdateCustomerPayload = z.infer<typeof updateCustomerSchema>;

// --- Route Definition ---
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers/$customer_id/update",
  component: UpdateCustomerRouteWrapper,
  loader: async ({ params }) => {
    const id = Number(params.customer_id);
    const profile = await customerService.get(id);
    if (!profile) throw new Error("Customer not found");
    return {
      customerId: id,
      profile: {
        name: profile.name,
        mobile_no: profile.mobile_no,
        mobile_no_2: profile.mobile_no_2 || "",
        aadhar_card_no: profile.aadhar_card_no || "",
        reference_name: profile.reference_name || "",
        active: profile.active,
      },
      lastUpdated: Date.now(),
    };
  },
  pendingComponent: LoadingSkeleton,
  errorComponent: ErrorState,
});

function UpdateCustomerRouteWrapper() {
  const { customerId, profile, lastUpdated } = Route.useLoaderData();
  return (
    <UpdateCustomerPage
      key={lastUpdated}
      customerId={customerId}
      profile={profile}
    />
  );
}

// --- Main Page Component ---
function UpdateCustomerPage({ customerId, profile }: any) {
  const queryClient = useQueryClient();
  const successRef = useRef<HTMLDivElement>(null);
  const [updatedCustomer, setUpdatedCustomer] = useState<Customer | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: UpdateCustomerPayload) => {
      await customerService.update(customerId, data);
      return { id: customerId, ...data } as Customer;
    },
    onSuccess: (data) => {
      setUpdatedCustomer(data);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const form = useForm({
    defaultValues: profile,
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
    <div className="flex-1 px-2 py-6 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative">
      <div className="relative z-10 space-y-6 sm:space-y-8">
        <Header customerId={customerId} />

        <Separator className="bg-zinc-800/50" />

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
          <div className="space-y-6">
            <CustomerDetailsForm form={form} />
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
          <div className="h-10 w-10 shrink-0 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <User className="h-5 w-5 text-emerald-50" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-zinc-100 to-zinc-400">
            Update Master Customer
          </h2>
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-2 py-0.5"
          >
            Edit Mode
          </Badge>
        </div>
        <p className="text-zinc-400/80 max-w-xl text-sm md:text-base font-medium">
          Manage master profile details for this client.
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
      <CardHeader className="p-4">
        <CardTitle className="flex items-center text-xl font-bold text-zinc-100 tracking-tight">
          <Contact className="mr-2.5 h-5 w-5 text-emerald-400" />
          Profile Details
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Essential contact and identification info for the master account.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:p-4 space-y-5 mt-2">
        <FormFieldWrapper
          form={form}
          name="name"
          label="Full Name"
          icon={User}
          required
          placeholder="e.g. Rahul Sharma"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
        </div>

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
      title="Master Customer Updated!"
      description={
        <span className="flex items-center gap-1.5 text-zinc-300 mt-1">
          Profile for ID:{" "}
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono text-sm px-2"
          >
            #{customer.id}
          </Badge>
          has been saved.
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
    <div className="flex-1 space-y-8 p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 bg-zinc-800" />
          <Skeleton className="h-4 w-96 bg-zinc-800" />
        </div>
        <Skeleton className="h-10 w-32 bg-zinc-800" />
      </div>

      <Skeleton className="h-[400px] w-full rounded-xl bg-zinc-900/50 border border-zinc-800/50" />
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto">
      <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-8 text-center space-y-4 shadow-xl">
        <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center">
          <ArrowLeft className="h-8 w-8 text-rose-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-rose-100">
            Failed to Load Profile
          </h2>
          <p className="text-rose-400/80 mt-2">
            The customer profile could not be found or an error occurred.
          </p>
        </div>
        <Button
          variant="outline"
          asChild
          className="mt-4 border-rose-900/50 hover:bg-rose-900/30 hover:text-rose-100"
        >
          <Link to="/customers">Return to Directory</Link>
        </Button>
      </div>
    </div>
  );
}
