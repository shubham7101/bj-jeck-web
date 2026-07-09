import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, Link, useRouter } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import { format } from "date-fns";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Box,
  Building2,
  Calculator,
  CalendarDays,
  Hammer,
  Hash,
  Info,
  Loader2,
  MapPin,
  Printer,
  Receipt,
  Smartphone,
  Trash,
  Truck,
  User,
} from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BillDetails, SizeCategory } from "@/schemas/billSchema";
import { billService } from "@/services/billService";
import { siteService } from "@/services/siteService";
import { formatCurrency } from "@/utils";

// Define the route
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bills/$billId",
  component: BillDetailsPage,
});

// --- Header Component ---
function BillHeader({ bill }: { bill: BillDetails }) {
  const router = useRouter();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => billService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      setIsDeleteModalOpen(false);
      navigate({ to: "/bills", replace: true });
    },
  });

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.history.back()}
          className="h-9 w-9 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors print:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-white print:text-black flex items-center gap-3 truncate">
            Invoice #{bill.id}
          </h2>
          <div className="flex items-center gap-2 text-sm text-zinc-500 print:text-zinc-700">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>
              {format(new Date(bill.from_date), "dd-MM-yyyy")} —{" "}
              {format(new Date(bill.to_date), "dd-MM-yyyy")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 print:hidden">
        <Button
          variant="outline"
          asChild
          className="h-9 border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:text-white hover:bg-zinc-700 hover:border-zinc-600 transition-all cursor-pointer"
        >
          <a
            href={`/api/generate/bill-pdf/${bill.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Printer className="mr-2 h-4 w-4" />
            Download Invoice
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsDeleteModalOpen(true);
          }}
          disabled={deleteMutation.isPending}
          className="h-9 w-9 text-rose-500 hover:text-rose-400 hover:bg-rose-950/30 cursor-pointer"
        >
          {deleteMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteMutation.mutate(bill.id)}
        title={`Delete Invoice #${bill.id}?`}
        description="This action cannot be undone. If there are any bills created after this bill's date, they will be permanently deleted too."
        confirmText="Delete Invoice"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

// --- Site Info Card ---
function SiteSection({ bill }: { bill: BillDetails }) {
  const { data: site, isLoading } = useQuery({
    queryKey: ["sites", bill.site_id],
    queryFn: () => siteService.get(bill.site_id),
  });

  return (
    <Card className="bg-zinc-900/40 backdrop-blur-sm shadow-xl border-zinc-800 h-full flex flex-col min-w-0 print:border print:border-zinc-300 print:shadow-none print:bg-white">
      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-zinc-800/50 space-y-0 print:pb-2 print:border-zinc-300">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800 print:hidden">
            <User className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <CardTitle className="text-sm font-medium text-zinc-200 uppercase tracking-wider print:text-black">
            Bill To
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 min-w-0 pt-4 sm:pt-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4 bg-zinc-800" />
            <Skeleton className="h-4 w-1/2 bg-zinc-800" />
            <Skeleton className="h-4 w-1/2 bg-zinc-800" />
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-2">
            <Link
              to="/sites/$siteId"
              params={{ siteId: bill.site_id.toString() }}
              className="text-xl font-bold text-zinc-100 hover:text-emerald-400 hover:underline transition-colors print:text-black print:no-underline truncate"
            >
              {site
                ? `#${site.id} ${site.contractor_name}`
                : `Site #${bill.site_id}`}
            </Link>

            {/* Site Details */}
            <div className="text-sm text-zinc-400 space-y-2.5 print:text-black print:mt-0">
              {site?.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-zinc-600 mt-0.5 shrink-0 print:text-black" />
                  <span className="leading-tight">{site.address}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {site?.mobile_no && (
                  <div
                    className="flex items-center gap-2.5"
                    title="Primary Mobile"
                  >
                    <Smartphone className="h-4 w-4 text-zinc-500 print:text-black" />
                    <span className="font-mono text-zinc-300 print:text-black">
                      {site.mobile_no}
                    </span>
                  </div>
                )}
                {bill.khata_no && (
                  <div className="flex items-center gap-2.5" title="Khata No">
                    <Hash className="h-4 w-4 text-zinc-500 print:text-black" />
                    <span className="font-mono text-zinc-300 print:text-black">
                      {bill.khata_no}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Financial Summary Card ---
function FinancialSection({ bill }: { bill: BillDetails }) {
  const totalLabour = Object.values(bill.labour_charges || {}).reduce(
    (a, b) => a + b,
    0,
  );
  const totalTransport = Object.values(bill.transport_charges || {}).reduce(
    (a, b) => a + b,
    0,
  );
  const totalLost = Object.values(bill.lost_charges || {}).reduce(
    (a, b) => a + b,
    0,
  );
  const rentalTotal = bill.total - totalLabour - totalTransport - totalLost;

  return (
    <Card className="bg-zinc-900/40 backdrop-blur-sm border-zinc-800 shadow-xl h-full overflow-hidden flex flex-col min-w-0 print:bg-white print:border-zinc-300 print:shadow-none">
      <div className="bg-linear-to-br from-emerald-500/10 via-zinc-900/50 to-zinc-950/50 p-4 sm:p-6 border-b border-emerald-900/20 print:bg-none print:bg-white print:border-b-zinc-300 print:p-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-emerald-500/80 text-xs font-bold uppercase tracking-wider print:text-black">
              Total Amount Due
            </span>
            <h1 className="text-4xl font-bold text-white mt-1 tabular-nums tracking-tight print:text-black">
              {formatCurrency(bill.total)}
            </h1>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 print:hidden">
            <Receipt className="h-5 w-5 text-emerald-500" />
          </div>
        </div>
      </div>

      <CardContent className="p-0 flex-1">
        <div className="p-6 space-y-4 print:p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400 flex items-center gap-2 print:text-zinc-600">
                <Building2 className="h-3.5 w-3.5" /> Material Rental
              </span>
              <span className="text-zinc-200 font-mono tabular-nums print:text-black">
                {formatCurrency(rentalTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400 flex items-center gap-2 print:text-zinc-600">
                <Hammer className="h-3.5 w-3.5" /> Labour Charges
              </span>
              <span className="text-zinc-200 font-mono tabular-nums print:text-black">
                {formatCurrency(totalLabour)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400 flex items-center gap-2 print:text-zinc-600">
                <Truck className="h-3.5 w-3.5" /> Transport Charges
              </span>
              <span className="text-zinc-200 font-mono tabular-nums print:text-black">
                {formatCurrency(totalTransport)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400 flex items-center gap-2 print:text-zinc-600">
                <Trash className="h-3.5 w-3.5" /> Lost Charges
              </span>
              <span className="text-zinc-200 font-mono tabular-nums print:text-black">
                {formatCurrency(totalLost)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdditionalChargesSection({ bill }: { bill: BillDetails }) {
  const allRecordIds = Array.from(
    new Set([
      ...Object.keys(bill.labour_charges || {}),
      ...Object.keys(bill.transport_charges || {}),
      ...Object.keys(bill.lost_charges || {}),
    ]),
  );

  const charges = allRecordIds
    .map((recordId) => {
      const labour = bill.labour_charges?.[recordId] || 0;
      const transport = bill.transport_charges?.[recordId] || 0;
      const lost = bill.lost_charges?.[recordId] || 0;
      return {
        recordId,
        labour,
        transport,
        lost,
        total: labour + transport + lost,
      };
    })
    .filter((rc) => rc.total > 0);

  if (charges.length === 0) {
    return (
      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl flex flex-col items-center justify-center p-6 text-center text-zinc-500 min-w-0 print:hidden">
        <Info className="h-8 w-8 text-zinc-600 mb-2" />
        <CardTitle className="text-sm font-medium text-zinc-400 mb-1">
          No Additional Charges
        </CardTitle>
        <p className="text-xs text-zinc-600 max-w-[260px]">
          No labour, transport, or lost charges are associated with the records
          in this bill.
        </p>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl flex flex-col min-w-0 print:bg-white print:border-zinc-300 print:shadow-none">
      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-zinc-800/50 space-y-0 print:pb-2 print:border-zinc-300">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800 print:hidden">
            <Calculator className="h-3.5 w-3.5 text-orange-400" />
          </div>
          <CardTitle className="text-sm font-medium text-zinc-200 print:text-black">
            Additional Charges Breakdown
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto max-h-[240px]">
        <Table>
          <TableHeader className="bg-zinc-900/30 sticky top-0 z-10 print:static print:bg-zinc-100">
            <TableRow className="border-zinc-800 hover:bg-transparent print:border-zinc-300">
              <TableHead className="w-[80px] pl-4 h-9 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-left print:text-black">
                Record No
              </TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-right print:text-black">
                Labour
              </TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-right print:text-black">
                Trans.
              </TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-right print:text-black">
                Lost
              </TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-right pr-4 print:text-black">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {charges.map((charge) => (
              <TableRow
                key={charge.recordId}
                className="border-zinc-800/50 hover:bg-zinc-900/30 transition-colors print:border-zinc-300 print:hover:bg-transparent"
              >
                <TableCell className="pl-4 font-bold text-zinc-400 text-xs">
                  <Link
                    to="/records/$recordId"
                    params={{ recordId: charge.recordId }}
                    className="hover:underline font-mono text-zinc-300 hover:text-orange-400"
                  >
                    #{charge.recordId}
                  </Link>
                </TableCell>
                <TableCell className="text-right font-mono text-zinc-300 text-xs">
                  {charge.labour > 0 ? formatCurrency(charge.labour) : "-"}
                </TableCell>
                <TableCell className="text-right font-mono text-zinc-300 text-xs">
                  {charge.transport > 0
                    ? formatCurrency(charge.transport)
                    : "-"}
                </TableCell>
                <TableCell className="text-right font-mono text-zinc-300 text-xs font-medium">
                  {charge.lost > 0 ? formatCurrency(charge.lost) : "-"}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-zinc-100 text-xs pr-4">
                  {formatCurrency(charge.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ClosingStockPanel({
  inventory,
}: {
  inventory: BillDetails["after_inventory"];
}) {
  if (!inventory || inventory.length === 0) return null;

  return (
    <div className="space-y-4 mb-8 break-inside-avoid print:break-before-auto">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 print:text-black">
        <Box className="h-5 w-5 text-zinc-400 print:text-black" />
        Closing Stock
        <Badge
          variant="secondary"
          className="bg-zinc-800 text-zinc-400 ml-2 print:border-zinc-300 print:bg-white print:text-black"
        >
          {inventory.length}
        </Badge>
      </h3>

      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl overflow-hidden min-w-0 w-full print:shadow-none print:bg-white print:border-zinc-300">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-900/50 sticky top-0 z-10 print:static print:bg-zinc-100">
              <TableRow className="border-zinc-800 hover:bg-transparent print:border-zinc-300">
                <TableHead className="w-1/3 pl-6 h-10 text-zinc-500 uppercase text-xs font-bold print:text-black">
                  Part Type
                </TableHead>
                <TableHead className="w-1/3 h-10 text-zinc-500 uppercase text-xs font-bold print:text-black">
                  Size
                </TableHead>
                <TableHead className="w-1/3 text-right pr-6 h-10 text-zinc-500 uppercase text-xs font-bold print:text-black">
                  Qty
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item, idx) => (
                <TableRow
                  key={`${item.part}-${item.size}-${idx}`}
                  className="border-zinc-800 hover:bg-zinc-900/40 transition-colors print:border-zinc-300 print:hover:bg-transparent"
                >
                  <TableCell className="pl-6 font-medium text-zinc-200 capitalize print:text-black">
                    {item.part == "full" ? "jeck" : item.part}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-zinc-900 border-zinc-700 text-zinc-400 font-normal print:bg-white print:text-black print:border-zinc-400"
                    >
                      {item.part != "plate" ? "2x" + item.size : item.size}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right pr-6 font-mono font-bold print:text-black ${
                      item.item_amount < 0 ? "text-rose-500" : "text-zinc-100"
                    }`}
                  >
                    {item.item_amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function LedgerTable({
  part,
  size,
  data,
}: {
  part: string;
  size: string;
  data: SizeCategory;
}) {
  if (part === "full") {
    part = "jeck";
    size = "2x" + size;
  }
  const sizeSubtotal =
    (data.lines || []).reduce((acc, line) => acc + line.total, 0) +
    data.initial_line.total;

  return (
    <div className="space-y-2 mb-8 break-inside-avoid">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <Badge
          variant="outline"
          className="bg-zinc-900 text-base px-2.5 py-0.5 border-zinc-700 text-white font-mono rounded-md capitalize print:bg-white print:text-black print:border-black"
        >
          {part}
        </Badge>
        <span className="text-zinc-600 text-xs">●</span>
        <Badge
          variant="secondary"
          className="bg-zinc-800/50 text-base px-2.5 py-0.5 text-zinc-300 font-mono rounded-md print:bg-white print:text-black print:border print:border-zinc-300"
        >
          {size}
        </Badge>

        {part.toLowerCase() === "full" && (
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider print:text-zinc-700 hidden sm:inline-block ml-2">
            F: Full | I: Inner | O: Outer
          </span>
        )}
        {part.toLowerCase() === "plate" && (
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider print:text-zinc-700 hidden sm:inline-block ml-2">
            P: Plate
          </span>
        )}

        <Separator className="flex-1 bg-zinc-800/50 print:bg-zinc-300" />
      </div>

      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl overflow-hidden min-w-0 w-full print:bg-white print:border-zinc-300 print:shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-900/50 print:bg-zinc-100">
              <TableRow className="border-zinc-800 hover:bg-transparent h-9 print:border-zinc-300">
                <TableHead className="w-[70px] pl-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-left print:text-black">
                  Ref #
                </TableHead>
                <TableHead className="w-[100px] text-[10px] font-bold uppercase text-zinc-500 tracking-wider print:text-black">
                  Date
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-500 text-center tracking-wider print:text-black">
                  Action
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-500 text-right tracking-wider print:text-black">
                  Qty
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-500 text-right tracking-wider print:text-black">
                  Balance
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-500 text-right tracking-wider print:text-black">
                  Days
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-500 text-right tracking-wider print:text-black">
                  Rate
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-500 text-right tracking-wider print:text-black">
                  Service
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-500 text-right tracking-wider print:text-black">
                  Damage
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-500 text-right pr-4 tracking-wider print:text-black">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 1. Initial Line (Opening Balance) */}
              <TableRow className="bg-zinc-900/20 border-zinc-800/50 hover:bg-zinc-900/30 h-9 print:bg-transparent print:border-zinc-300">
                <TableCell className="pl-4 font-mono text-zinc-600 text-xs print:text-black">
                  -
                </TableCell>
                <TableCell className="font-mono text-zinc-500 text-xs print:text-black">
                  {format(new Date(data.initial_line.date), "dd-MM-yy")}
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider print:text-black">
                    Opening
                  </span>
                </TableCell>
                <TableCell className="text-right text-zinc-600 font-mono text-xs print:text-black">
                  -
                </TableCell>
                <TableCell className="text-right font-bold text-zinc-400 font-mono text-xs tabular-nums print:text-black">
                  {Object.keys(data.initial_line.item_details || {}).length > 0
                    ? Object.entries(data.initial_line.item_details || {})
                        .map(([k, v]) => `${k[0].toUpperCase()}: ${v}`)
                        .join(", ")
                    : "-"}
                </TableCell>
                <TableCell className="text-right text-zinc-400 font-mono text-xs tabular-nums print:text-black">
                  {data.initial_line.days > 0 ? data.initial_line.days : "-"}
                </TableCell>
                <TableCell className="text-right text-zinc-400 font-mono text-xs tabular-nums print:text-black">
                  {data.initial_line.rate
                    ? data.initial_line.rate.toFixed(2)
                    : "-"}
                </TableCell>
                <TableCell className="text-right text-zinc-600 font-mono text-xs print:text-black">
                  -
                </TableCell>
                <TableCell className="text-right text-zinc-600 font-mono text-xs print:text-black">
                  -
                </TableCell>
                <TableCell className="text-right font-medium text-emerald-400 font-mono text-xs pr-4 tabular-nums print:text-black">
                  {data.initial_line.total > 0
                    ? formatCurrency(data.initial_line.total)
                    : "-"}
                </TableCell>
              </TableRow>

              {/* 2. Transaction Lines */}
              {(data.lines || []).map((line, idx) => (
                <TableRow
                  key={`${line.record_id}-${idx}`}
                  className="border-zinc-800/50 hover:bg-zinc-900/40 h-10 transition-colors print:border-zinc-300 print:hover:bg-transparent"
                >
                  <TableCell className="pl-4 font-mono text-xs">
                    <Link
                      to="/records/$recordId"
                      params={{ recordId: line.record_id.toString() }}
                      className="text-zinc-500 hover:text-blue-400 hover:underline transition-colors print:text-zinc-700 print:no-underline"
                    >
                      #{line.record_id}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-zinc-300 text-xs print:text-black">
                    {format(new Date(line.date), "dd-MM-yy")}
                  </TableCell>
                  <TableCell className="text-center">
                    {line.transaction_type === "OUT" ? (
                      <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-950/40 text-orange-400 border border-orange-900/30 print:bg-transparent print:text-black print:border-none print:px-0">
                        <ArrowUpRight className="h-3 w-3 mr-1 print:hidden" />{" "}
                        OUT
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 print:bg-transparent print:text-black print:border-none print:px-0">
                        <ArrowDownLeft className="h-3 w-3 mr-1 print:hidden" />{" "}
                        IN
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-zinc-300 text-xs tabular-nums print:text-black">
                    {line.item_amount}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-white text-[10px] tabular-nums print:text-black">
                    {line.total_item_amount && (
                      <div className="flex flex-col gap-0 items-end">
                        {Object.entries(line.total_item_amount).map(
                          ([k, v]) =>
                            v !== 0 && (
                              <div
                                key={k}
                                className={v < 0 ? "text-rose-500" : ""}
                              >
                                {k[0].toUpperCase()}: {v as number}
                              </div>
                            ),
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-zinc-400 text-xs tabular-nums print:text-black">
                    {line.days > 0 ? (
                      line.days
                    ) : (
                      <span className="text-zinc-700 print:text-zinc-400">
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-zinc-400 text-xs tabular-nums print:text-black">
                    {line.rate ? line.rate.toFixed(2) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-zinc-400 text-xs tabular-nums print:text-black">
                    {line.service_charge > 0 ? (
                      line.service_charge
                    ) : (
                      <span className="text-zinc-700 print:text-zinc-400">
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-xs tabular-nums print:text-black ${line.broken_charge > 0 ? "text-rose-400 font-semibold" : ""}`}
                  >
                    {line.broken_charge > 0 ? (
                      line.broken_charge
                    ) : (
                      <span className="text-zinc-700 print:text-zinc-400">
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-emerald-400 text-xs pr-4 tabular-nums print:text-black">
                    {line.total > 0 ? (
                      formatCurrency(line.total)
                    ) : (
                      <span className="text-zinc-700 print:text-zinc-400">
                        -
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="bg-zinc-900/80 border-t border-zinc-800 print:bg-zinc-100 print:border-zinc-300">
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={9}
                  className="text-right text-xs font-bold text-zinc-400 uppercase tracking-wider h-10 print:text-black"
                >
                  Subtotal
                </TableCell>
                <TableCell className="text-right text-sm font-bold text-white font-mono pr-4 tabular-nums print:text-black">
                  {formatCurrency(sizeSubtotal)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// --- Main Page ---

function BillDetailsPage() {
  const { billId } = Route.useParams();
  const navigate = Route.useNavigate();

  const {
    data: bill,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["bills", billId],
    queryFn: () => billService.get(Number(billId)),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (isError || !bill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
          <Receipt className="h-6 w-6 text-zinc-500" />
        </div>
        <h2 className="text-xl font-medium text-white">Invoice Not Found</h2>
        <Button variant="secondary" onClick={() => navigate({ to: "/bills" })}>
          Return to List
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-[100vw] lg:max-w-5xl lg:mx-auto px-2 py-4 sm:py-6 sm:p-6 md:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 overflow-x-hidden min-w-0 print:max-w-none print:p-0">
      <BillHeader bill={bill} />

      {/* Grid Layout: 2 Columns Dashboard */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 print:grid-cols-2 h-auto items-start min-w-0">
        <SiteSection bill={bill} />
        <FinancialSection bill={bill} />
        <AdditionalChargesSection bill={bill} />
      </div>

      <div className="pt-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-1 bg-emerald-500 rounded-full print:bg-black" />
          <h3 className="text-lg font-semibold text-white tracking-tight print:text-black">
            Rental Ledger Details
          </h3>
        </div>

        {/* UPDATED: Loop for items_by_size_and_part -> Table */}
        {Object.entries(bill.items_by_size_and_part || {}).map(
          ([key, data]) => {
            const [part, size] = key.split("_");
            return (
              <div key={key} className="mb-6">
                <LedgerTable part={part} size={size} data={data} />
              </div>
            );
          },
        )}

        <ClosingStockPanel inventory={bill.after_inventory} />
      </div>

      {/* Print Footer */}
      <div className="hidden print:flex flex-col items-center justify-center mt-12 pt-8 border-t border-zinc-300 text-zinc-500 text-xs">
        <p className="font-medium text-black">Jack Rental Service</p>
        <p>Thank you for your business.</p>
        <p className="mt-1">Generated on {format(new Date(), "PPP p")}</p>
      </div>
    </div>
  );
}
