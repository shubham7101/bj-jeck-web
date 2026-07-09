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
  BarChart3,
  Calculator,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Coins,
  Edit,
  FileText,
  History,
  Layers,
  Loader2,
  MapPin,
  PackageOpen,
  Phone,
  Trash,
  Truck,
  UserX,
} from "lucide-react";
import { useMemo, useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Customer } from "@/schemas/customerSchema";
import { customerService } from "@/services/customerService";
import { formatCurrency, formatDate, getInitials } from "@/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";

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

      <div className="grid gap-6 md:grid-cols-2">
        <CustomerContactCard customer={customer} />
        <CustomerRatesCard id={customer.id} />
      </div>

      <CustomerStatsSection id={customer.id} />

      <div className="grid gap-6 lg:grid-cols-3">
        <CustomerInventorySection id={customer.id} />
        <QuickLinks id={customer.id} />
      </div>
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
            to="/customers/statement/$customerId"
            params={{ customerId: customer.id.toString() }}
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
    <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl backdrop-blur-sm relative overflow-hidden flex flex-col justify-between h-full">
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-emerald-500 to-emerald-400/50 z-10" />
      <div className="h-24 bg-linear-to-br from-zinc-800/80 to-zinc-900/80 relative border-b border-zinc-800/50">
        <Avatar className="absolute -bottom-10 left-6 h-20 w-20 border-4 border-zinc-950 shadow-md">
          <AvatarImage src={customer.avatar || ""} />
          <AvatarFallback className="bg-zinc-800 text-xl font-bold text-zinc-300">
            {getInitials(customer.name)}
          </AvatarFallback>
        </Avatar>
      </div>
      <CardContent className="pt-12 pb-6 px-4 sm:px-6 relative z-10">
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight text-zinc-100">
            {customer.name}
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex gap-6">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Phone className="h-4 w-4 text-emerald-500" />
                <span className="text-zinc-200 font-medium">
                  {customer.mobile_no}
                  {customer.mobile_no_2 && (
                    <span className="text-zinc-500 ml-1 font-normal">
                      {" "}
                      / {customer.mobile_no_2}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm text-zinc-400">
                <MapPin className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                <span className="leading-tight">{customer.address}</span>
              </div>
            </div>

            {(customer.aadhar_card_no || customer.reference_name) && (
              <div className="flex gap-6 pt-2 border-t border-zinc-800/50 mt-1">
                {customer.aadhar_card_no && (
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">
                      Aadhar No
                    </span>
                    <span className="text-sm text-zinc-300 font-mono">
                      {customer.aadhar_card_no}
                    </span>
                  </div>
                )}
                {customer.reference_name && (
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">
                      Reference
                    </span>
                    <span className="text-sm text-zinc-300">
                      {customer.reference_name}
                    </span>
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

function CustomerRatesCard({ id }: { id: number }) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_LIMIT = 4;

  const { data: rates, isLoading } = useQuery({
    queryKey: ["customer", id, "rates"],
    queryFn: () => customerService.getRates(id),
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
      <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-zinc-800/50 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-zinc-900 rounded-md border border-zinc-800">
            <Calculator className="h-4 w-4 text-emerald-500" />
          </div>
          <CardTitle className="text-base font-medium text-zinc-200">
            Daily Rental Rates
          </CardTitle>
        </div>
        <Link
          to="/customers/update/$customerId"
          params={{ customerId: id.toString() }}
        >
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
                to="/customers/update/$customerId"
                params={{ customerId: id.toString() }}
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

function CustomerStatsSection({ id }: { id: number }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["customer", id, "stats"],
    queryFn: () => customerService.customerStats(id),
  });

  const isValidDate = (dateStr?: string | null) => {
    return dateStr && dateStr.length > 5 && !dateStr.startsWith("0001-01-01");
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            className="h-28 w-full bg-zinc-900 border border-zinc-800 rounded-xl"
          />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="w-full rounded-xl border border-zinc-800/50 bg-zinc-900/30 border-dashed p-8 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 shadow-inner">
            <BarChart3 className="h-6 w-6 text-zinc-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-zinc-300">
              No Statistics Available
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs">
              We couldn't retrieve financial data for this customer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const billed = stats.bills?.total_bill_amount ?? 0;
  const paid = stats.ledger?.total_paid ?? 0;
  const discounted = stats.ledger?.total_discounted ?? 0;
  const refunded = stats.ledger?.total_refunded ?? 0;
  const balance = billed - paid - discounted + refunded;
  const recordsCount = stats.records?.total_count ?? 0;
  const billsCount = stats.bills?.total_count ?? 0;
  const ledgerPaid = stats.ledger?.total_paid ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Records"
        value={recordsCount}
        subText={
          recordsCount > 0 && isValidDate(stats.records?.latest_date)
            ? `Latest: #${stats.records?.latest_id} • ${formatDate(
                stats.records?.latest_date || "",
              )}`
            : "No activity recorded"
        }
        icon={<Layers className="h-4 w-4" />}
      />
      <StatsCard
        title="Total Billed Amount"
        value={formatCurrency(billed)}
        valueColor="text-zinc-200"
        icon={<FileText className="h-4 w-4" />}
        subText={
          billsCount > 0 && isValidDate(stats.bills?.latest_from_date)
            ? `Latest: #${stats.bills?.latest_id} (${formatDate(
                stats.bills?.latest_from_date || "",
              )} - ${formatDate(stats.bills?.latest_to_date || "")})`
            : "No bills generated"
        }
      />
      <StatsCard
        title="Payments & Discounts"
        value={formatCurrency(ledgerPaid + discounted)}
        valueColor="text-emerald-400"
        icon={<Coins className="h-4 w-4" />}
        subText={`Paid: ${formatCurrency(ledgerPaid)} | Discount: ${formatCurrency(discounted)}`}
      />
      <StatsCard
        title="Outstanding Balance"
        value={formatCurrency(balance)}
        subText={balance > 0 ? "Due Payment" : "Fully Paid"}
        icon={<Calculator className="h-4 w-4" />}
        valueColor={balance > 0 ? "text-rose-400" : "text-emerald-400"}
      />
    </div>
  );
}

function CustomerInventorySection({ id }: { id: number }) {
  const [combineParts, setCombineParts] = useState(false);
  const {
    data: inventory,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customer", id, "inventory"],
    queryFn: () => customerService.getInventory(id),
    select: (data) => data || [],
  });

  inventory?.sort((a, b) => {
    if (a.part !== b.part) return a.part.localeCompare(b.part);
    return a.size.localeCompare(b.size);
  });

  const { data: rates } = useQuery({
    queryKey: ["customer", id, "rates"],
    queryFn: () => customerService.getRates(id),
  });

  const getRate = (part: string, size: string) => {
    if (!rates) return null;
    const rateItem = rates.find(
      (r) =>
        r.part.toLowerCase() === part.toLowerCase() &&
        r.size.toLowerCase() === size.toLowerCase(),
    );
    return rateItem ? rateItem.rate : null;
  };

  const displayInventory = useMemo(() => {
    if (!combineParts || !inventory) return inventory || [];

    const itemsBySize = new Map<string, typeof inventory>();
    inventory.forEach((item) => {
      if (!itemsBySize.has(item.size)) {
        itemsBySize.set(item.size, []);
      }
      itemsBySize.get(item.size)!.push({ ...item });
    });

    const combined: typeof inventory = [];

    itemsBySize.forEach((items, size) => {
      const innerItem = items.find((i) => i.part.toLowerCase() === "inner");
      const outerItem = items.find((i) => i.part.toLowerCase() === "outer");
      let fullItem = items.find((i) => i.part.toLowerCase() === "full");

      if (innerItem && outerItem) {
        const innerQty = innerItem.item_amount;
        const outerQty = outerItem.item_amount;

        if ((innerQty > 0 && outerQty > 0) || (innerQty < 0 && outerQty < 0)) {
          const combineQty =
            Math.abs(innerQty) < Math.abs(outerQty) ? innerQty : outerQty;

          if (combineQty !== 0) {
            innerItem.item_amount -= combineQty;
            outerItem.item_amount -= combineQty;

            if (fullItem) {
              fullItem.item_amount += combineQty;
            } else {
              fullItem = { part: "full", size, item_amount: combineQty };
              items.push(fullItem);
            }
          }
        }
      }

      items.forEach((item) => {
        if (item.item_amount !== 0) {
          combined.push(item);
        }
      });
    });

    return combined.sort((a, b) => {
      if (a.part !== b.part) return a.part.localeCompare(b.part);
      return a.size.localeCompare(b.size);
    });
  }, [inventory, combineParts]);

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          Current Inventory
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCombineParts(!combineParts)}
          className={`h-8 text-xs cursor-pointer transition-all ${
            combineParts
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
              : "text-zinc-400 border-zinc-800 bg-zinc-950 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <Layers className="h-3 w-3 mr-1.5" />
          {combineParts ? "Uncombine Parts" : "Combine Parts"}
        </Button>
      </div>
      <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl backdrop-blur-sm overflow-hidden min-h-64">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-900/50 sticky top-0 z-10 border-b border-zinc-800/50">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="w-1/4 pl-6 h-10 text-zinc-500 uppercase text-xs font-bold">
                  Part Type
                </TableHead>
                <TableHead className="w-1/4 h-10 text-zinc-500 uppercase text-xs font-bold">
                  Size
                </TableHead>
                <TableHead className="w-1/4 h-10 text-zinc-500 uppercase text-xs font-bold">
                  Rate
                </TableHead>
                <TableHead className="w-1/4 text-right pr-6 h-10 text-zinc-500 uppercase text-xs font-bold">
                  Qty
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <TableRow key={i} className="border-zinc-800">
                    <TableCell className="pl-6">
                      <Skeleton className="h-4 w-24 bg-zinc-900" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 bg-zinc-900 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12 bg-zinc-900" />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Skeleton className="h-4 w-8 bg-zinc-900 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-rose-500 gap-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm">
                        Failed to load inventory data.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !displayInventory || displayInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                      <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                        <PackageOpen className="h-5 w-5 text-zinc-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-400">
                          No Items Found
                        </span>
                        <span className="text-xs text-zinc-600">
                          This customer has no active inventory.
                        </span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayInventory.map((item, idx) => {
                  const rate = getRate(item.part, item.size);
                  return (
                    <TableRow
                      key={idx}
                      className="border-zinc-800 hover:bg-zinc-900/40 transition-colors"
                    >
                      <TableCell className="pl-6 font-medium text-zinc-200 capitalize">
                        {item.part}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-zinc-900 border-zinc-700 text-zinc-400 font-normal"
                        >
                          {item.size}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-300 font-medium">
                        {rate !== null ? (
                          `₹${Number(rate).toFixed(2)}`
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right pr-6 font-mono font-bold ${
                          item.item_amount < 0
                            ? "text-rose-500"
                            : "text-zinc-100"
                        }`}
                      >
                        {item.item_amount}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
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
      to: "/customers/statement/$customerId" as const,
      search: undefined,
      params: { customerId: id.toString() },
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
