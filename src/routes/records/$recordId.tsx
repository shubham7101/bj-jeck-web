import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, Link, useRouter } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Edit,
  FileText,
  IndianRupee,
  Layers,
  Loader2,
  Package,
  Printer,
  Smartphone,
  Trash,
  Trash2,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { themeStyles } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type { Customer } from "@/schemas/customerSchema";
import type { RecordDetails, RecordItem } from "@/schemas/recordSchema";
import { customerService } from "@/services/customerService";
import { recordService } from "@/services/recordService";

// Define the route
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/records/$recordId",
  component: RecordDetailsPage,
});

// Helper for initials
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

function RecordHeader({ record }: { record: RecordDetails }) {
  const navigate = Route.useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => recordService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      navigate({ to: "/records", replace: true });
    },
    onError: (error) => {
      console.error("Failed to delete record", error);
      alert("Failed to delete record.");
    },
  });

  const handleDelete = () => {
    if (
      !window.confirm(
        `Are you sure you want to delete Record #${record.id}? Inventory will be reverted.`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(record.id);
  };

  const isTypeIn = record.transaction_type === "IN";
  const isBilled = !!record.bill_id;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-xl backdrop-blur-md shadow-sm print:hidden">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.history.back()}
          className="h-9 w-9 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Record #{record.id}
            </h2>
            <Badge
              variant="outline"
              className={cn(
                isTypeIn ? themeStyles.badgeIn : themeStyles.badgeOut,
              )}
            >
              {isTypeIn ? (
                <ArrowDownLeft className="h-3 w-3" />
              ) : (
                <ArrowUpRight className="h-3 w-3" />
              )}
              {record.transaction_type}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
            {record.date}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="h-9 border-zinc-805 bg-zinc-950 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer text-xs font-semibold"
        >
          <Printer className="mr-1.5 h-3.5 w-3.5" />
          Print Chalan
        </Button>
        <Link
          to="/records/update/$recordId"
          params={{ recordId: record.id.toString() }}
          disabled={isBilled}
          className={cn(isBilled && "pointer-events-none opacity-50")}
        >
          <Button
            variant="outline"
            disabled={isBilled}
            className="h-9 border-zinc-805 bg-zinc-950 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer text-xs font-semibold"
            title={
              isBilled
                ? "Cannot edit: Record is included in a bill"
                : "Edit Record"
            }
          >
            <Edit className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Edit
          </Button>
        </Link>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={deleteMutation.isPending || isBilled}
          title={
            isBilled
              ? "Cannot delete: Record is included in a bill"
              : "Delete Record"
          }
          className={cn(
            "h-9 text-xs font-semibold transition-all border border-transparent",
            isBilled
              ? "opacity-50 cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-500"
              : "border-zinc-800 bg-zinc-950 text-zinc-450 hover:text-rose-400 hover:bg-rose-950/20 cursor-pointer",
          )}
        >
          {deleteMutation.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash className="mr-1.5 h-3.5 w-3.5 text-rose-500" />
          )}
          Delete
        </Button>
      </div>
    </div>
  );
}

function CustomerInfoBar({
  record,
  customer,
}: {
  record: RecordDetails;
  customer: Customer | undefined;
}) {
  return (
    <div className={themeStyles.customerInfoBar}>
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-inner print:hidden">
          <AvatarImage
            src={customer?.avatar || undefined}
            alt={customer?.name || "Customer"}
          />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {customer ? getInitials(customer.name) : "CU"}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-bold text-zinc-100 hover:underline print:text-black">
              {customer ? (
                <Link
                  to="/customers/$customerId"
                  params={{ customerId: customer.id.toString() }}
                >
                  {customer.name}
                </Link>
              ) : (
                <span>Customer #{record.customer_id}</span>
              )}
            </h4>
            {customer && (
              <Badge
                variant="outline"
                className={cn(
                  customer.active
                    ? themeStyles.activeBadge
                    : themeStyles.inactiveBadge,
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 h-1.5 w-1.5 rounded-full print:hidden",
                    customer.active
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-zinc-500",
                  )}
                />
                {customer.active ? "Active" : "Inactive"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap print:text-zinc-700">
            <span className="font-semibold text-zinc-200 print:text-black">
              ID: #{record.customer_id}
            </span>
            {customer && (
              <>
                <span>•</span>
                <span>{customer.mobile_no}</span>
                <span>•</span>
                <span className="italic">{customer.address}</span>
              </>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-center print:hidden">
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm"
        >
          Customer Profile
        </Badge>
      </div>
    </div>
  );
}

function GeneralInfoCard({ record }: { record: RecordDetails }) {
  return (
    <Card className={themeStyles.cardBase}>
      <div className={themeStyles.accentBarBlue} />
      <CardHeader className="pb-3 border-b border-zinc-800/50 bg-zinc-900/50 print:bg-transparent print:border-zinc-300">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-zinc-950 rounded-md border border-zinc-800 shadow-sm print:hidden">
            <Truck className="h-4 w-4 text-blue-500" />
          </div>
          <CardTitle className="text-base font-semibold text-zinc-200 print:text-black">
            Transport & Billing Status
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 flex-1">
        {/* Vehicle Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800 hover:border-blue-500/20 transition-all flex flex-col justify-between h-20 shadow-inner print:border-zinc-300 print:bg-transparent">
            <div className="flex items-center gap-2 text-zinc-500 print:text-zinc-600">
              <Truck className="h-3.5 w-3.5 text-blue-400 print:hidden" />
              <span className="text-[10px] uppercase font-bold tracking-wider">
                Vehicle No
              </span>
            </div>
            <p className="text-base font-bold font-mono text-zinc-200 print:text-black">
              {record.vehicle_no || "Not Specified"}
            </p>
          </div>

          <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800 hover:border-blue-500/20 transition-all flex flex-col justify-between h-20 shadow-inner print:border-zinc-300 print:bg-transparent">
            <div className="flex items-center gap-2 text-zinc-500 print:text-zinc-650">
              <Smartphone className="h-3.5 w-3.5 text-blue-400 print:hidden" />
              <span className="text-[10px] uppercase font-bold tracking-wider">
                Driver Contact
              </span>
            </div>
            <p className="text-base font-bold font-mono text-zinc-200 print:text-black">
              {record.vehicle_mobile_no || "Not Specified"}
            </p>
          </div>
        </div>

        <Separator className="bg-zinc-800 print:bg-zinc-300" />

        {/* Billing Status Card */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
            Chalan Billing Details
          </span>
          {record.bill_id ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-linear-to-r from-emerald-950/30 to-emerald-900/10 border border-emerald-900/30 group hover:border-emerald-500/40 transition-all shadow-sm print:border-zinc-300 print:bg-transparent">
              <div className="flex items-center gap-3.5">
                <div className="bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-800/50 shadow-inner print:hidden">
                  <FileText className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-emerald-500 tracking-widest">
                    Included in Bill
                  </span>
                  <span className="text-sm font-semibold text-emerald-100 flex items-center gap-1.5 print:text-black">
                    Invoice{" "}
                    <span className="text-emerald-400 print:text-black">
                      #{record.bill_id}
                    </span>
                  </span>
                </div>
              </div>
              <Link
                to="/bills/$billId"
                params={{ billId: record.bill_id.toString() }}
                className="p-2.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950 rounded-lg transition-colors border border-transparent hover:border-emerald-800/50 shadow-sm print:hidden"
                title="View Bill"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/60 border-dashed hover:bg-zinc-900/40 transition-colors print:border-zinc-300 print:bg-transparent">
              <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800 print:hidden">
                <AlertCircle className="h-4 w-4 text-zinc-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
                  Billing Status
                </span>
                <span className="text-sm font-medium text-zinc-400 print:text-zinc-650">
                  Unbilled Record (Pending Settlement)
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialInfoCard({ record }: { record: RecordDetails }) {
  const totalBrokenCharges = record.items.reduce(
    (sum, item) => sum + (item.broken_charge || 0),
    0,
  );
  const totalBrokenQty = record.items.reduce(
    (sum, item) => sum + (item.broken_amount || 0),
    0,
  );
  const totalServiceCharges = record.items.reduce(
    (sum, item) => sum + (item.service_charge || 0),
    0,
  );
  const totalLostCharges = record.items.reduce(
    (sum, item) => sum + (item.lost_charge || 0),
    0,
  );
  const grandTotalAmount =
    (record.labour_charge || 0) +
    (record.transport_charge || 0) +
    totalBrokenCharges +
    totalServiceCharges +
    totalLostCharges;

  return (
    <Card className={themeStyles.cardBase}>
      <div className={themeStyles.accentBarEmerald} />
      <CardHeader className="pb-3 border-b border-zinc-800/50 bg-zinc-900/50 print:bg-transparent print:border-zinc-300">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-zinc-950 rounded-md border border-zinc-800 shadow-sm print:hidden">
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </div>
          <CardTitle className="text-base font-semibold text-zinc-200 print:text-black">
            Ledger & Summary Valuation
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-6 flex-1 flex flex-col justify-between space-y-6">
        {/* 2x3 responsive charges grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* 1. Labour */}
          <div className="p-3 bg-zinc-950/40 border border-zinc-800 hover:border-emerald-500/20 transition-all rounded-xl flex flex-col justify-between h-20 shadow-inner print:border-zinc-300 print:bg-transparent">
            <div className="flex items-center justify-between text-zinc-500 print:text-zinc-650">
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Labour
              </span>
              <Wrench className="h-3.5 w-3.5 text-emerald-500 print:hidden" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-black text-emerald-400 print:text-black">
                ₹{(record.labour_charge || 0).toLocaleString("en-IN")}
              </div>
              <div className="text-[8px] text-zinc-500">calculated charge</div>
            </div>
          </div>

          {/* 2. Transport */}
          <div className="p-3 bg-zinc-950/40 border border-zinc-800 hover:border-purple-500/20 transition-all rounded-xl flex flex-col justify-between h-20 shadow-inner print:border-zinc-300 print:bg-transparent">
            <div className="flex items-center justify-between text-zinc-500 print:text-zinc-650">
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Transport
              </span>
              <Truck className="h-3.5 w-3.5 text-purple-500 print:hidden" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-black text-purple-400 print:text-black">
                ₹{(record.transport_charge || 0).toLocaleString("en-IN")}
              </div>
              <div className="text-[8px] text-zinc-500">additional charge</div>
            </div>
          </div>

          {/* 3. Broken */}
          <div className="p-3 bg-zinc-950/40 border border-zinc-800 hover:border-rose-500/20 transition-all rounded-xl flex flex-col justify-between h-20 shadow-inner print:border-zinc-300 print:bg-transparent">
            <div className="flex items-center justify-between text-zinc-500 print:text-zinc-650">
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Broken
              </span>
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500 print:hidden" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-black text-rose-400 print:text-black">
                ₹{totalBrokenCharges.toLocaleString("en-IN")}
              </div>
              <div className="text-[8px] text-zinc-500 font-semibold">
                {totalBrokenQty} broken pcs
              </div>
            </div>
          </div>

          {/* 4. Service */}
          <div className="p-3 bg-zinc-950/40 border border-zinc-800 hover:border-amber-500/20 transition-all rounded-xl flex flex-col justify-between h-20 shadow-inner print:border-zinc-300 print:bg-transparent">
            <div className="flex items-center justify-between text-zinc-500 print:text-zinc-650">
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Service
              </span>
              <Zap className="h-3.5 w-3.5 text-amber-500 print:hidden" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-black text-amber-400 print:text-black">
                ₹{totalServiceCharges.toLocaleString("en-IN")}
              </div>
              <div className="text-[8px] text-zinc-500">maintenance fee</div>
            </div>
          </div>

          {/* 5. Lost */}
          <div className="p-3 bg-zinc-950/40 border border-zinc-800 hover:border-rose-600/20 transition-all rounded-xl flex flex-col justify-between h-20 shadow-inner print:border-zinc-300 print:bg-transparent">
            <div className="flex items-center justify-between text-zinc-500 print:text-zinc-650">
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Lost
              </span>
              <Trash2 className="h-3.5 w-3.5 text-rose-555 print:hidden" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-black text-rose-400 print:text-black">
                ₹{totalLostCharges.toLocaleString("en-IN")}
              </div>
              <div className="text-[8px] text-zinc-500">
                missing items value
              </div>
            </div>
          </div>

          {/* 6. Total Qty */}
          <div className="p-3 bg-zinc-950/40 border border-zinc-800 hover:border-blue-500/20 transition-all rounded-xl flex flex-col justify-between h-20 shadow-inner print:border-zinc-300 print:bg-transparent">
            <div className="flex items-center justify-between text-zinc-500 print:text-zinc-650">
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Total Qty
              </span>
              <Layers className="h-3.5 w-3.5 text-blue-500 print:hidden" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-black text-blue-400 print:text-black">
                {record.total}
              </div>
              <div className="text-[8px] text-zinc-500">filtered pieces</div>
            </div>
          </div>
        </div>

        {/* Grand Total Valuation Bar */}
        <div className="border-t border-zinc-800/80 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-950/20 p-4 rounded-xl print:border-zinc-300 print:bg-transparent">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="font-bold text-zinc-300 text-[10px] uppercase tracking-wider print:text-zinc-700">
              Total Chalan Valuation
            </span>
            <p className="text-[9px] text-zinc-500 print:text-zinc-500">
              Sum of labour, transport, damages, lost & maintenance charges
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-black text-2xl text-primary tracking-tight print:text-black">
              ₹{grandTotalAmount.toLocaleString("en-IN")}
            </span>
            <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">
              valuation summary
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecordItemsTable({ items }: { items: RecordItem[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 print:text-black">
        <Package className="h-5 w-5 text-primary print:hidden" />
        Record Items
        <Badge
          variant="outline"
          className="bg-zinc-900/80 text-zinc-400 border-zinc-800 ml-2 print:bg-white print:text-black print:border-black"
        >
          {items.length} {items.length === 1 ? "Item" : "Items"}
        </Badge>
      </h3>
      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl overflow-hidden print:bg-white print:border-zinc-300 print:shadow-none rounded-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-950/50 print:bg-zinc-100">
                <TableRow className="border-zinc-800/80 hover:bg-transparent print:border-zinc-300">
                  <TableHead className="w-[16%] pl-6 text-zinc-400 uppercase text-[10px] font-bold tracking-wider print:text-black">
                    Part Details
                  </TableHead>
                  <TableHead className="w-[10%] text-zinc-400 uppercase text-[10px] font-bold tracking-wider text-center print:text-black">
                    Size
                  </TableHead>
                  <TableHead className="w-[12%] text-zinc-400 uppercase text-[10px] font-bold tracking-wider text-center print:text-black">
                    Good Qty
                  </TableHead>
                  <TableHead className="w-[12%] text-zinc-400 uppercase text-[10px] font-bold tracking-wider text-center print:text-black">
                    Broken Qty
                  </TableHead>
                  <TableHead className="w-[12%] text-zinc-400 uppercase text-[10px] font-bold tracking-wider text-center print:text-black">
                    Broken Charge
                  </TableHead>
                  <TableHead className="w-[12%] text-zinc-400 uppercase text-[10px] font-bold tracking-wider text-center print:text-black">
                    Service Charge
                  </TableHead>
                  <TableHead className="w-[12%] text-zinc-400 uppercase text-[10px] font-bold tracking-wider text-center print:text-black">
                    Lost Charge
                  </TableHead>
                  <TableHead className="w-[14%] pr-6 text-zinc-400 uppercase text-[10px] font-bold tracking-wider text-right print:text-black">
                    Total Qty
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-zinc-800/50 print:divide-zinc-300">
                {items.map((item, index) => (
                  <TableRow
                    key={index}
                    className="border-none hover:bg-zinc-900/40 transition-colors group print:hover:bg-transparent"
                  >
                    <TableCell className="w-[16%] pl-6 py-4 font-semibold text-zinc-200 capitalize print:text-black">
                      {item.part}
                    </TableCell>
                    <TableCell className="w-[10%] py-4 text-center">
                      <Badge
                        variant="outline"
                        className="bg-zinc-950/50 border-zinc-800 text-zinc-400 font-normal font-mono px-2 py-0.5 print:bg-white print:text-black print:border-zinc-400"
                      >
                        {item.size}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[12%] py-4 text-center font-medium text-zinc-300 print:text-black">
                      {item.item_amount}
                    </TableCell>
                    <TableCell className="w-[12%] py-4 text-center">
                      <span
                        className={cn(
                          "font-semibold",
                          item.broken_amount === 0
                            ? "text-zinc-500"
                            : "text-rose-455 print:text-rose-600",
                        )}
                      >
                        {item.broken_amount === 0 ? "-" : item.broken_amount}
                      </span>
                    </TableCell>
                    <TableCell className="w-[12%] py-4 text-center">
                      <span
                        className={cn(
                          "font-mono font-bold text-xs",
                          item.broken_charge === 0
                            ? "text-zinc-500"
                            : "text-rose-455 print:text-rose-600",
                        )}
                      >
                        {item.broken_charge === 0
                          ? "-"
                          : `₹${item.broken_charge.toLocaleString("en-IN")}`}
                      </span>
                    </TableCell>

                    <TableCell className="w-[12%] py-4 text-center">
                      <span
                        className={cn(
                          "font-mono font-bold text-xs",
                          item.service_charge === 0
                            ? "text-zinc-500"
                            : "text-amber-400 print:text-amber-605",
                        )}
                      >
                        {item.service_charge === 0
                          ? "-"
                          : `₹${item.service_charge.toLocaleString("en-IN")}`}
                      </span>
                    </TableCell>
                    <TableCell className="w-[12%] py-4 text-center">
                      <span
                        className={cn(
                          "font-mono font-bold text-xs",
                          item.lost_charge === 0
                            ? "text-zinc-500"
                            : "text-rose-400 print:text-rose-600",
                        )}
                      >
                        {item.lost_charge === 0
                          ? "-"
                          : `₹${item.lost_charge.toLocaleString("en-IN")}`}
                      </span>
                    </TableCell>
                    <TableCell className="w-[14%] pr-6 py-4 text-right font-black text-zinc-200 print:text-black">
                      {item.item_amount + item.broken_amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Page Component ---

function RecordDetailsPage() {
  const { recordId } = Route.useParams();

  // 1. Fetch Record
  const {
    data: record,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["records", recordId],
    queryFn: () => recordService.get(Number(recordId)),
  });

  const { data: customer } = useQuery({
    queryKey: ["customers", record?.customer_id],
    queryFn: () => customerService.get(record?.customer_id as number),
    enabled: !!record?.customer_id, // Dependent query flag
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Skeleton className="h-9 w-9 bg-zinc-800" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 bg-zinc-800" />
              <Skeleton className="h-4 w-32 bg-zinc-800" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 bg-zinc-800" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 w-full bg-zinc-900 border border-zinc-800 rounded-xl" />
          <Skeleton className="h-48 w-full bg-zinc-900 border border-zinc-800 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full bg-zinc-900 border border-zinc-800 rounded-xl" />
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] space-y-6 p-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-center h-24 w-24 rounded-full bg-zinc-900 border border-zinc-800 shadow-xl">
          <AlertCircle className="h-10 w-10 text-zinc-500" />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Record Not Found
          </h2>
          <p className="text-zinc-400">
            We couldn't locate a record with ID{" "}
            <span className="font-mono text-zinc-200">#{recordId}</span>.
          </p>
        </div>
        <Button
          variant="outline"
          asChild
          className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
        >
          <Link to="/records">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500 print:p-0 print:max-w-none">
      <RecordHeader record={record} />

      <CustomerInfoBar record={record} customer={customer} />

      <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">
        <GeneralInfoCard record={record} />
        <FinancialInfoCard record={record} />
      </div>

      <RecordItemsTable items={record.items} />
    </div>
  );
}
