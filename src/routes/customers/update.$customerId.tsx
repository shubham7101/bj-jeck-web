import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  RotateCcw,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { FormInput } from "@/components/form/FormInput";
import { FormCheckbox } from "@/components/form/FormCheckbox";
import { useAppForm } from "@/components/form/hooks";
import { customerService } from "@/services/customerService";
import {
  updateCustomerSchema,
  updateCustomerRatesSchema,
  type UpdateCustomer,
  type UpdateCustomerRates,
} from "@/schemas/customerSchema";
import { ErrorAlert } from "@/components/ErrorAlert";

// --- Route Definition ---
export const Route = createFileRoute("/customers/update/$customerId")({
  component: UpdateCustomerPage,
  loader: async ({ params }) => {
    const id = Number(params.customerId);

    // Fetch Profile and Rates in parallel
    const [profile, rates] = await Promise.all([
      customerService.get(id),
      // Handle case where rates might not exist yet (return null/default)
      customerService.getRates(id).catch(() => null),
    ]);

    if (!profile) throw new Error("Customer not found");

    // Normalize data for the form
    return {
      customerId: id,
      profile: {
        name: profile.name,
        mobile_no: profile.mobile_no,
        address: profile.address,
        active: profile.active,
      } as UpdateCustomer,
      rates: {
        size_1_5: rates?.size_1_5 ?? 0,
        size_2: rates?.size_2 ?? 0,
        size_2_5: rates?.size_2_5 ?? 0,
        size_3: rates?.size_3 ?? 0,
      } as UpdateCustomerRates,
    };
  },
  pendingComponent: LoadingSkeleton,
  errorComponent: ErrorState,
});

// --- Constants ---
const RATE_FIELDS = [
  { name: "size_1_5", label: "Size 1.5", step: "0.05" },
  { name: "size_2", label: "Size 2.0", step: "0.05" },
  { name: "size_2_5", label: "Size 2.5", step: "0.05" },
  { name: "size_3", label: "Size 3.0", step: "0.05" },
] as const;

function CustomerUpdateForms({
  customerId,
  initialProfile,
  initialRates,
}: {
  customerId: number;
  initialProfile: UpdateCustomer;
  initialRates: UpdateCustomerRates;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Temporary success UI states (to show green banners for 3 seconds)
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [ratesSuccess, setRatesSuccess] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup timers
  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const triggerSuccess = (setter: (val: boolean) => void) => {
    setter(true);
    const timer = setTimeout(() => setter(false), 3000);
    timersRef.current.push(timer);
  };

  // --- 1. Profile Mutation ---
  const customerMutation = useMutation({
    mutationFn: (data: UpdateCustomer) =>
      customerService.update(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      triggerSuccess(setProfileSuccess);
      router.invalidate(); // Refresh loader data
    },
  });

  const customerForm = useAppForm({
    defaultValues: initialProfile,
    validators: { onSubmit: updateCustomerSchema },
    onSubmit: async ({ value }) => {
      await customerMutation.mutateAsync(value);
    },
  });

  // --- 2. Rates Mutation ---
  const ratesMutation = useMutation({
    mutationFn: (data: UpdateCustomerRates) =>
      customerService.updateRates(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] }); // Invalidate specific rates query if it exists
      triggerSuccess(setRatesSuccess);
      router.invalidate();
    },
  });

  const ratesForm = useAppForm({
    defaultValues: initialRates,
    validators: { onSubmit: updateCustomerRatesSchema },
    onSubmit: async ({ value }) => {
      await ratesMutation.mutateAsync(value);
    },
  });

  return (
    <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 items-start">
      {/* --- PROFILE CARD --- */}
      <Card className="bg-zinc-950/50 border-zinc-800 shadow-lg">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update basic contact information.</CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            customerForm.handleSubmit();
          }}
        >
          <CardContent className="space-y-4">
            {customerMutation.isError && (
              <ErrorAlert error={customerMutation.error} />
            )}

            <customerForm.Field name="name">
              {(field) => (
                <FormInput
                  field={field}
                  label="Full Name"
                  placeholder="e.g. John Doe"
                />
              )}
            </customerForm.Field>
            <customerForm.Field name="mobile_no">
              {(field) => (
                <FormInput
                  field={field}
                  label="Mobile Number"
                  placeholder="10-digit number"
                  inputMode="numeric"
                />
              )}
            </customerForm.Field>
            <customerForm.Field name="address">
              {(field) => (
                <FormInput
                  field={field}
                  label="Address"
                  placeholder="Site, Area, City"
                />
              )}
            </customerForm.Field>
            <customerForm.Field name="active">
              {(field) => (
                <div className="pt-2">
                  <FormCheckbox
                    field={field}
                    label="Active Customer"
                    description="Uncheck to mark this customer as inactive."
                  />
                </div>
              )}
            </customerForm.Field>

            {profileSuccess && (
              <SuccessAlert message="Profile updated successfully." />
            )}
          </CardContent>
          <CardFooter className="pt-6 flex justify-end">
            <SubmitButton
              isSubmitting={customerMutation.isPending}
              label="Save Profile"
            />
          </CardFooter>
        </form>
      </Card>

      {/* --- RATES CARD --- */}
      <Card className="bg-zinc-950/50 border-zinc-800 shadow-lg">
        <CardHeader>
          <CardTitle>Rental Rates Configuration</CardTitle>
          <CardDescription>
            Update the daily cost per jack size.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            ratesForm.handleSubmit();
          }}
        >
          <CardContent className="space-y-6">
            {ratesMutation.isError && (
              <ErrorAlert error={ratesMutation.error} />
            )}

            <div className="grid grid-cols-2 gap-4">
              {RATE_FIELDS.map((rateField) => (
                <ratesForm.Field
                  key={rateField.name}
                  name={rateField.name as keyof UpdateCustomerRates}
                >
                  {(field) => (
                    <FormInput
                      field={field}
                      label={rateField.label}
                      type="number"
                      step={rateField.step}
                      min="0"
                    />
                  )}
                </ratesForm.Field>
              ))}
            </div>

            {ratesSuccess && (
              <SuccessAlert message="Rates updated successfully." />
            )}
          </CardContent>
          <CardFooter className="pt-6 flex justify-end">
            <SubmitButton
              isSubmitting={ratesMutation.isPending}
              label="Update Rates"
              variant="secondary"
            />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// --- Main Page Component ---
function UpdateCustomerPage() {
  const { customerId, profile, rates } = Route.useLoaderData();
  const router = useRouter();

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Update Customer
          </h2>
          <p className="text-muted-foreground">
            Manage profile details and rental rates independently.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.invalidate()}
            className="cursor-pointer hover:bg-zinc-800"
            title="Refresh Data from Server"
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" asChild className="cursor-pointer">
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

      <CustomerUpdateForms
        customerId={customerId}
        initialProfile={profile}
        initialRates={rates}
      />
    </div>
  );
}

// --- Helper Components ---

function SuccessAlert({ message }: { message: string }) {
  return (
    <Alert className="bg-emerald-950/30 border-emerald-500/30 text-emerald-400 py-2 animate-in fade-in slide-in-from-top-2">
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle className="mb-0 text-sm font-medium">{message}</AlertTitle>
    </Alert>
  );
}

function SubmitButton({
  isSubmitting,
  label,
  variant = "default",
}: {
  isSubmitting: boolean;
  label: string;
  variant?: "default" | "secondary";
}) {
  const isSecondary = variant === "secondary";
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      className={`min-w-32 cursor-pointer transition-all ${
        isSecondary
          ? "bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 border border-emerald-800/50"
          : ""
      }`}
    >
      {isSubmitting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Save className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 bg-zinc-800" />
          <Skeleton className="h-4 w-96 bg-zinc-800" />
        </div>
        <Skeleton className="h-10 w-32 bg-zinc-800" />
      </div>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Skeleton className="h-96 w-full bg-zinc-900 rounded-xl" />
        <Skeleton className="h-96 w-full bg-zinc-900 rounded-xl" />
      </div>
    </div>
  );
}

// Used by ErrorComponent
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
