import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRoute,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import {
  AlertCircle,
  ArrowLeft,
  ClipboardList,
  Edit,
  Fingerprint,
  Loader2,
  MapPin,
  Phone,
  Trash,
  User,
  UserX,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Customer } from "@/schemas/customerSchema";
import { customerService } from "@/services/customerService";
import { formatDate, getInitials } from "@/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { siteService } from "@/services/siteService";
import { SiteInventorySection } from "@/components/InventorySection";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers/$customerId",
  component: CustomerDetailsPage,
  loader: async ({ params }) => {
    const id = Number(params.customerId);
    const data = await customerService.get(id);
    if (!data) throw new Error("Customer not found");
    return data;
  },
  pendingComponent: CustomerSkeleton,
  errorComponent: CustomerError,
});

// --- Main Component ---

function CustomerDetailsPage() {
  // Data is guaranteed to exist because of the Loader
  const customer = Route.useLoaderData();

  return (
    <div className="flex-1 space-y-6 md:space-y-8 px-2 py-6 sm:p-6 md:p-8 md:pt-6 animate-in fade-in duration-500 overflow-x-hidden">
      <CustomerHeader customer={customer} />

      <div className="grid gap-6 lg:grid-cols-6">
        <div className="lg:col-span-3">
          <CustomerContactCard customer={customer} />
        </div>
        <div className="lg:col-span-3">
          <CustomerInventoryContainer id={customer.id} />
        </div>
      </div>

      <CustomerSitesSection customerId={customer.id} />
    </div>
  );
}

// --- Components ---

function CustomerHeader({ customer }: { customer: Customer }) {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: () => customerService.setActive(customer.id, !customer.active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      router.invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => customerService.delete(customer.id),
    onSuccess: () => {
      navigate({
        to: "/customers",
        replace: true,
      });
    },
    onError: () => {
      setDeleteError(true);
      setShowConfirm(false);
      setTimeout(() => setDeleteError(false), 5000);
    },
  });

  const handleDelete = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    deleteMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.history.go(-1)}
          className="h-9 w-9 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            {customer.name}
            <Badge
              variant="outline"
              onClick={() => toggleMutation.mutate()}
              title={`Click to mark as ${customer.active ? "Inactive" : "Active"}`}
              className={`
                ml-2 px-2.5 py-0.5 rounded-full border text-xs font-medium cursor-pointer select-none transition-all duration-300
                ${
                  customer.active
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/50"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200"
                }
                ${toggleMutation.isPending ? "opacity-70 cursor-wait" : ""}
              `}
            >
              {toggleMutation.isPending ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <span
                  className={`mr-1.5 h-1.5 w-1.5 rounded-full transition-colors ${
                    customer.active
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-zinc-500"
                  }`}
                />
              )}
              {customer.active ? "Active" : "Inactive"}
            </Badge>
          </h2>
          <p className="text-sm text-zinc-500">
            ID: #{customer.id.toString().padStart(3, "0")} • Joined{" "}
            {formatDate(customer.joined_date)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
        <div className="grid grid-cols-2 lg:flex gap-2 w-full lg:w-auto">
          <Link to="/sites/new" search={{ customer_id: customer.id }}>
            <Button className="w-full bg-white text-zinc-950 hover:bg-zinc-200 font-semibold shadow-lg shadow-zinc-950/20 transition-all cursor-pointer">
              <MapPin className="mr-2 h-4 w-4" /> Add New Site
            </Button>
          </Link>
          <Link
            to="/"
            // to="/customers/statement/$customerId"
            // params={{ customerId: customer.id.toString() }}
          >
            <Button
              variant="outline"
              className="w-full border-blue-500/30 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500/50 transition-all cursor-pointer"
            >
              <ClipboardList className="mr-2 h-4 w-4" /> Statement
            </Button>
          </Link>
        </div>

        {/* Edit & Delete Group */}
        <div className="flex items-center justify-end gap-1 border-t border-zinc-800/50 sm:border-none pt-3 sm:pt-0 sm:pl-1">
          <Link
            to="/customers/update/$customerId"
            params={{ customerId: customer.id.toString() }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Edit Customer Details"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className={`transition-colors cursor-pointer ${
              deleteError
                ? "text-rose-500 bg-rose-950/40 border border-rose-900/50"
                : "text-zinc-500 hover:text-rose-500 hover:bg-rose-950/20"
            }`}
            title={deleteError ? "Failed to delete" : "Delete Customer"}
          >
            {deleteError ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
          </Button>

          <ConfirmDialog
            isOpen={showConfirm}
            onClose={() => setShowConfirm(false)}
            onConfirm={() => deleteMutation.mutate()}
            title="Delete Customer"
            description={`Are you sure you want to permanently delete ${customer.name}? This action cannot be undone and will fail if they have active records.`}
            confirmText="Delete Customer"
            isPending={deleteMutation.isPending}
            isDestructive={true}
          />
        </div>
      </div>
    </div>
  );
}

function CustomerContactCard({ customer }: { customer: Customer }) {
  return (
    <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl backdrop-blur-sm relative overflow-hidden flex flex-col justify-between h-full group/card transition-colors">
      <CardContent className="py-4 sm:py-6 relative z-10 flex-1 flex flex-col">
        <div className="flex items-center gap-5 mb-auto pb-6">
          <Avatar className="h-16 w-16 border-2 border-zinc-800 shadow-md transition-transform group-hover/card:scale-105 duration-300 z-30 bg-zinc-950">
            <AvatarImage src={customer.avatar || ""} />
            <AvatarFallback className="bg-zinc-800 text-xl font-bold text-zinc-300">
              {getInitials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-bold tracking-tight text-zinc-100 leading-tight">
            {customer.name}
          </h3>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
              {/* Phone Section */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0 mt-0.5">
                  <Phone className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">
                    Phone
                  </span>
                  <span className="text-zinc-200 font-medium text-sm">
                    {customer.mobile_no}
                    {customer.mobile_no_2 && (
                      <span className="text-zinc-500 ml-1 font-normal">
                        {" "}
                        / {customer.mobile_no_2}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Aadhar & Reference Section */}
            {(customer.aadhar_card_no || customer.reference_name) && (
              <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 pt-5 border-t border-zinc-800/50 mt-1">
                {customer.aadhar_card_no && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0 mt-0.5">
                      <Fingerprint className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">
                        Aadhar No
                      </span>
                      <span className="text-sm text-zinc-300 font-mono">
                        {customer.aadhar_card_no}
                      </span>
                    </div>
                  </div>
                )}
                {customer.reference_name && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">
                        Reference
                      </span>
                      <span className="text-sm text-zinc-300">
                        {customer.reference_name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerSitesSection({ customerId }: { customerId: number }) {
  const { data: sites, isLoading } = useQuery({
    queryKey: ["customer", customerId, "sites"],
    queryFn: () => siteService.getByCustomer(customerId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-100">Customer Sites</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-40 w-full rounded-xl bg-zinc-900 border border-zinc-800"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-500" />
          Associated Sites
          <Badge
            variant="outline"
            className="ml-2 bg-zinc-900 text-zinc-400 border-zinc-800"
          >
            {sites?.length || 0}
          </Badge>
        </h3>
      </div>

      {!sites || sites.length === 0 ? (
        <Card className="bg-zinc-900/40 border-zinc-800 border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <MapPin className="h-8 w-8 mb-4 text-zinc-700" />
            <p className="text-sm font-medium text-zinc-300 mb-1">
              No sites found
            </p>
            <p className="text-xs">
              This customer doesn't have any registered sites yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Link
              key={site.id}
              to="/sites/$siteId"
              params={{ siteId: site.id.toString() }}
            >
              <Card className="bg-zinc-900/40 border-zinc-800 shadow-md hover:bg-zinc-900/60 hover:border-zinc-700 transition-all cursor-pointer h-full group">
                <CardContent className="p-5 flex flex-col h-full gap-4">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-semibold text-zinc-200 group-hover:text-emerald-400 transition-colors leading-tight">
                      {site.contractor_name}
                    </h4>
                    <Badge
                      variant="outline"
                      className={`shrink-0 ${site.active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                    >
                      {site.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="space-y-2 mt-auto text-sm text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{site.mobile_no}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span className="line-clamp-2 leading-snug text-xs">
                        {site.address}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerInventoryContainer({ id }: { id: number }) {
  const {
    data: inventory,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customer", id, "inventory"],
    queryFn: () => customerService.getInventory(id),
    select: (data) => data || [],
  });

  return (
    <SiteInventorySection
      inventory={inventory}
      rates={[]}
      isLoading={isLoading}
      isError={isError}
    />
  );
}

function CustomerSkeleton() {
  return (
    <div className="flex-1 space-y-6 px-2 py-6 sm:p-6 md:p-8 md:pt-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Skeleton className="h-9 w-9 bg-zinc-800" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-zinc-800" />
            <Skeleton className="h-4 w-32 bg-zinc-800" />
          </div>
        </div>
        <Skeleton className="h-10 w-48 bg-zinc-800" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-52 w-full bg-zinc-900 border border-zinc-800 rounded-xl" />
        <Skeleton className="h-52 w-full bg-zinc-900 border border-zinc-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            className="h-28 w-full bg-zinc-900 border border-zinc-800 rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}

function CustomerError({ error }: { error: Error }) {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] space-y-6 p-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-center h-24 w-24 rounded-full bg-zinc-900 border border-zinc-800 shadow-xl">
        <UserX className="h-10 w-10 text-zinc-500" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Customer Not Found
        </h2>
        <p className="text-zinc-400">
          We couldn't locate this customer.
          <br />
          <span className="text-xs text-zinc-600 mt-2 block">
            {error.message}
          </span>
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
