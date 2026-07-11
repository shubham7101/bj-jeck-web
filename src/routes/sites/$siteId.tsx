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
  ArrowRight,
  Building2,
  Calculator,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Coins,
  Edit,
  FileText,
  History,
  Loader2,
  MapPin,
  Phone,
  Trash,
  Truck,
  UserX,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { Site } from "@/schemas/siteSchema";
import { siteService } from "@/services/siteService";
import { getInitials } from "@/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { InventorySection } from "@/components/InventorySection";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sites/$siteId",
  component: SiteDetailsPage,
  loader: async ({ params }) => {
    const id = Number(params.siteId);
    const data = await siteService.get(id);
    if (!data) throw new Error("Site not found");
    return data;
  },
  pendingComponent: SiteSkeleton,
  errorComponent: SiteError,
});

// --- Main Component ---

function SiteDetailsPage() {
  const site = Route.useLoaderData();

  return (
    <div className="flex-1 space-y-6 md:space-y-8 px-2 py-6 sm:p-6 md:p-8 md:pt-6 animate-in fade-in duration-500 overflow-x-hidden">
      <SiteHeader site={site} />

      <div className="grid gap-6 md:grid-cols-2">
        <SiteContactCard site={site} />
        <SiteRatesCard id={site.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 min-w-0">
          <SiteInventoryContainer id={site.id} />
        </div>
        <div className="min-w-0">
          <QuickLinks id={site.id} />
        </div>
      </div>
    </div>
  );
}

// --- Components ---

function SiteHeader({ site }: { site: Site }) {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: () => siteService.setActive(site.id, !site.active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      router.invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => siteService.delete(site.id),
    onSuccess: () => {
      navigate({
        to: "/sites",
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
            {site.contractor_name}
            <Badge
              variant="outline"
              onClick={() => toggleMutation.mutate()}
              title={`Click to mark as ${site.active ? "Inactive" : "Active"}`}
              className={`
                ml-2 px-2.5 py-0.5 rounded-full border text-xs font-medium cursor-pointer select-none transition-all duration-300
                ${
                  site.active
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
                    site.active ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"
                  }`}
                />
              )}
              {site.active ? "Active" : "Inactive"}
            </Badge>
          </h2>
          <p className="text-sm text-zinc-500">
            ID: #{site.id.toString().padStart(3, "0")}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
        <div className="grid grid-cols-2 lg:flex gap-2 w-full lg:w-auto">
          <Link to="/records/new" search={undefined}>
            <Button className="w-full bg-white text-zinc-950 hover:bg-zinc-200 font-semibold shadow-lg shadow-zinc-950/20 transition-all cursor-pointer">
              <Truck className="mr-2 h-4 w-4" /> New Record
            </Button>
          </Link>

          <Link to="/ledger/new" search={undefined}>
            <Button
              variant="outline"
              className="w-full border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/50 transition-all cursor-pointer"
            >
              <Coins className="mr-2 h-4 w-4" /> Receive Payment
            </Button>
          </Link>
          <Link
            to="/sites/statement/$siteId"
            params={{ siteId: site.id.toString() }}
          >
            <Button
              variant="outline"
              className="w-full border-blue-500/30 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500/50 transition-all cursor-pointer"
            >
              <ClipboardList className="mr-2 h-4 w-4" /> Statement
            </Button>
          </Link>
          <Link to="/bills/new" search={undefined}>
            <Button
              variant="outline"
              className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <FileText className="mr-2 h-4 w-4" /> Bill
            </Button>
          </Link>
        </div>

        {/* Edit & Delete Group */}
        <div className="flex items-center justify-end gap-1 border-t border-zinc-800/50 sm:border-none pt-3 sm:pt-0 sm:pl-1">
          <Link
            to="/sites/update/$siteId"
            params={{ siteId: site.id.toString() }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Edit Site Details"
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
            title={deleteError ? "Failed to delete" : "Delete Site"}
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
            title="Delete Site"
            description={`Are you sure you want to permanently delete ${site.contractor_name}? This action cannot be undone and will fail if they have active records.`}
            confirmText="Delete Site"
            isPending={deleteMutation.isPending}
            isDestructive={true}
          />
        </div>
      </div>
    </div>
  );
}

function SiteContactCard({ site }: { site: Site }) {
  return (
    <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl backdrop-blur-sm relative overflow-hidden flex flex-col justify-between h-full group/card transition-colors">
      <CardContent className="py-2 sm:py-4 relative z-10 flex-1 flex flex-col">
        <div className="flex items-center gap-5 mb-auto pb-6">
          <Avatar className="h-16 w-16 border-2 border-zinc-800 shadow-md transition-transform group-hover/card:scale-105 duration-300 z-30 bg-zinc-950">
            <AvatarFallback className="bg-zinc-800 text-xl font-bold text-zinc-300">
              {getInitials(site.contractor_name)}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-bold tracking-tight text-zinc-100 leading-tight">
            {site.contractor_name}
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
                    {site.mobile_no}
                    {site.mobile_no_2 && (
                      <span className="text-zinc-500 ml-1 font-normal">
                        / {site.mobile_no_2}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Address Section */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">
                    Address
                  </span>
                  <span className="leading-tight text-zinc-200 text-sm max-w-[200px]">
                    {site.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Master Customer Section */}
            <div className="pt-4 border-t border-zinc-800/50 mt-auto">
              <Link
                to="/customers/$customerId"
                params={{ customerId: site.customer_id.toString() }}
                className="group flex items-center justify-between p-3 -mx-3 rounded-xl hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0 mt-0.5 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-colors">
                    <Building2 className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">
                      Master Customer
                    </span>
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-indigo-400 transition-colors font-mono">
                      #{site.customer_id.toString().padStart(3, "0")}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-indigo-400 transition-all duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SiteRatesCard({ id }: { id: number }) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_LIMIT = 4;

  const { data: rates, isLoading } = useQuery({
    queryKey: ["site", id, "rates"],
    queryFn: () => siteService.getRates(id),
  });

  if (isLoading)
    return (
      <Skeleton className="h-52 w-full bg-zinc-900 border border-zinc-800 rounded-xl" />
    );

  const hasRates = Array.isArray(rates) && rates.length > 0;

  // Determine what to show based on state
  const visibleRates = hasRates
    ? showAll
      ? rates
      : rates.slice(0, INITIAL_LIMIT)
    : [];

  const hasMore = hasRates && rates.length > INITIAL_LIMIT;

  return (
    <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl backdrop-blur-sm relative overflow-hidden flex flex-col h-full min-h-56">
      <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-zinc-800/50 ">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-zinc-900 rounded-md border border-zinc-800">
            <Calculator className="h-4 w-4 text-emerald-500" />
          </div>
          <CardTitle className="text-base font-medium text-zinc-200">
            Daily Rental Rates
          </CardTitle>
        </div>
        <Link to="/sites/update/$siteId" params={{ siteId: id.toString() }}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/30 cursor-pointer"
          >
            <Edit className="h-3 w-3 mr-1" /> Edit Rates
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="flex-1 pt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          {hasRates ? (
            visibleRates.map((rateItem, index) => (
              <div
                key={`${rateItem.part}-${rateItem.size}-${index}`}
                className="flex flex-col p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/50 hover:border-zinc-700 transition-colors"
              >
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className="text-xs text-zinc-500 tracking-wider capitalize font-medium truncate">
                    {rateItem.part}
                  </span>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-[10px] h-4 px-1.5 py-0 border-zinc-700 text-zinc-400 bg-zinc-950"
                  >
                    {rateItem.size}
                  </Badge>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-zinc-200">
                    ₹{Number(rateItem.rate).toFixed(2)}
                  </span>
                  <span className="text-xs text-zinc-600">/day</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-4 text-zinc-500 italic text-sm">
              No rates configured.
              <Link
                to="/sites/update/$siteId"
                params={{ siteId: id.toString() }}
                className="block mt-2 text-emerald-500 underline hover:text-emerald-400"
              >
                Set Rates
              </Link>
            </div>
          )}
        </div>

        {/* Show More / Show Less Button */}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-auto h-8 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
          >
            {showAll ? (
              <>
                <ChevronUp className="mr-2 h-3 w-3" /> Show Less
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-3 w-3" /> Show{" "}
                {rates.length - INITIAL_LIMIT} More
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function SiteInventoryContainer({ id }: { id: number }) {
  const {
    data: inventory,
    isLoading: isInventoryLoading,
    isError,
  } = useQuery({
    queryKey: ["site", id, "inventory"],
    queryFn: () => siteService.getInventory(id),
    select: (data) => data || [],
  });

  const { data: rates, isLoading: isRatesLoading } = useQuery({
    queryKey: ["site", id, "rates"],
    queryFn: () => siteService.getRates(id),
  });

  return (
    <InventorySection
      inventory={inventory}
      rates={rates}
      isLoading={isInventoryLoading || isRatesLoading}
      isError={isError}
    />
  );
}

function QuickLinks({ id }: { id: number }) {
  const LINKS = [
    {
      to: "/records" as const,
      search: undefined,
      params: undefined,
      icon: History,
      title: "Record History",
      subtitle: "View In/Out transactions",
      colorClass: "text-blue-400",
    },
    {
      to: "/sites/statement/$siteId" as const,
      search: undefined,
      params: { siteId: id.toString() },
      icon: ClipboardList,
      title: "Account Statement",
      subtitle: "Print combined ledger statement",
      colorClass: "text-indigo-400",
    },
    {
      to: "/ledger" as const,
      search: undefined,
      params: undefined,
      icon: Coins,
      title: "Payment Ledger",
      subtitle: "View payment history",
      colorClass: "text-emerald-400",
    },
    {
      to: "/bills" as const,
      search: undefined,
      params: undefined,
      icon: FileText,
      title: "Generated Bills",
      subtitle: "View past bills",
      colorClass: "text-amber-400",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-zinc-100 px-1">
        History & Logs
      </h3>
      <div className="flex flex-col gap-3">
        {LINKS.map((link, idx) => (
          <Link
            key={idx}
            to={link.to}
            search={link.search as any}
            params={link.params as any}
          >
            <div className="group flex items-center justify-between p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm hover:bg-zinc-800/60 hover:border-zinc-700 transition-all cursor-pointer shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 group-hover:border-zinc-700 shadow-inner">
                  <div className={`h-5 w-5 ${link.colorClass}`}>
                    <link.icon className="w-full h-full" />
                  </div>
                </div>
                <div>
                  <div className="font-medium text-zinc-200">{link.title}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {link.subtitle}
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SiteSkeleton() {
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
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 w-full lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl" />
        <Skeleton className="h-64 w-full bg-zinc-900 border border-zinc-800 rounded-xl" />
      </div>
    </div>
  );
}

function SiteError({ error }: { error: Error }) {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] space-y-6 p-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-center h-24 w-24 rounded-full bg-zinc-900 border border-zinc-800 shadow-xl">
        <UserX className="h-10 w-10 text-zinc-500" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Site Not Found
        </h2>
        <p className="text-zinc-400">
          We couldn't locate this site.
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
