import { useEffect, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle2, User, X, Loader2, ArrowLeft } from "lucide-react";
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
  type CreateCustomer,
  type Customer,
} from "@/schemas/customerSchema";
import { ErrorAlert } from "@/components/ErrorAlert";

export const Route = createFileRoute("/customers/new")({
  component: NewCustomerPage,
});

const RATE_FIELDS = [
  { name: "rates.size_1_5", label: "Size 1.5" },
  { name: "rates.size_2", label: "Size 2.0" },
  { name: "rates.size_2_5", label: "Size 2.5" },
  { name: "rates.size_3", label: "Size 3.0" },
] as const;

const DEFAULT_VALUES: CreateCustomer = {
  name: "",
  mobile_no: "",
  address: "",
  rates: {
    size_1_5: 1.5,
    size_2: 1.5,
    size_2_5: 1.5,
    size_3: 1.5,
  },
};

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
    onSubmit: async ({ value }: any) => {
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
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">New Customer</h2>
          <p className="text-muted-foreground">
            Add a new customer to the system for tracking jack rentals.
          </p>
        </div>
        <Button variant="outline" asChild className="hidden sm:flex">
          <Link to="/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </div>

      {mutation.isError && <ErrorAlert error={mutation.error} />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-8"
      >
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
          <Card className="sm:col-span-2 md:col-span-3 lg:col-span-4 bg-zinc-900/50 border-zinc-800 h-full shadow-md">
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
              <CardDescription>
                Enter the personal information and contact details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="name">
                {(field: any) => (
                  <FormInput
                    field={field}
                    label="Full Name"
                    placeholder="e.g. Rahul Sharma"
                    autoFocus
                  />
                )}
              </form.Field>
              <form.Field name="mobile_no">
                {(field: any) => (
                  <FormInput
                    field={field}
                    label="Mobile Number"
                    placeholder="10-digit number"
                    inputMode="numeric"
                    maxLength={10}
                  />
                )}
              </form.Field>
              <form.Field name="address">
                {(field: any) => (
                  <FormInput
                    field={field}
                    label="Address"
                    placeholder="Site, Area, City"
                  />
                )}
              </form.Field>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 md:col-span-2 lg:col-span-3 bg-zinc-900/50 border-zinc-800 h-full shadow-md">
            <CardHeader>
              <CardTitle>Rental Rates</CardTitle>
              <CardDescription>
                Configure the daily rates (₹) per jack size.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 grid-cols-2">
              {RATE_FIELDS.map((rateItem) => (
                <form.Field key={rateItem.name} name={rateItem.name}>
                  {(field: any) => (
                    <FormInput
                      field={field}
                      label={rateItem.label}
                      type="number"
                      step="0.05"
                      min="0"
                      onFocus={(e) => e.target.select()}
                    />
                  )}
                </form.Field>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 pt-2">
          <Button
            variant="ghost"
            type="button"
            onClick={handleReset}
            disabled={mutation.isPending}
            className="hover:bg-zinc-800 cursor-pointer"
          >
            Reset Form
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="min-w-40 cursor-pointer"
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {mutation.isPending ? "Creating..." : "Create Customer"}
          </Button>
        </div>
      </form>

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
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <Card className="border-emerald-500/30 bg-emerald-950/10 relative overflow-hidden shadow-lg shadow-emerald-900/10">
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-emerald-600 hover:text-emerald-400 hover:bg-emerald-900/30 cursor-pointer"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close notification</span>
          </Button>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <CardTitle className="text-xl text-emerald-500">
              Customer Created Successfully
            </CardTitle>
          </div>
          <CardDescription className="text-emerald-400/80">
            The customer record has been added to the database with ID
            <span className="font-mono font-medium text-emerald-300 ml-1">
              #{customer.id}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm bg-black/20 p-4 rounded-md border border-emerald-500/10">
            <div className="flex flex-col gap-1">
              <span className="text-emerald-500/70 text-xs uppercase font-semibold">
                Name
              </span>
              <span className="font-medium text-emerald-100">
                {customer.name}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-emerald-500/70 text-xs uppercase font-semibold">
                Mobile
              </span>
              <span className="font-medium text-emerald-100 font-mono">
                {customer.mobile_no}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-emerald-500/70 text-xs uppercase font-semibold">
                Address
              </span>
              <span className="font-medium text-emerald-100 truncate">
                {customer.address}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-emerald-950/30 py-4 flex gap-3">
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-500 text-white border-none"
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
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300 cursor-pointer"
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
