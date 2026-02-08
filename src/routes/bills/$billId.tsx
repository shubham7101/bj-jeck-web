import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Printer,
  User,
  Hash,
  MapPin,
  Smartphone,
  ArrowUpRight,
  ArrowDownLeft,
  Hammer,
  Receipt,
  Loader2,
  Trash,
  CalendarDays,
  Box,
  Info,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { billService } from "@/services/billService";
import { customerService } from "@/services/customerService";
import type { BillDetails, SizeCategory } from "@/schemas/billSchema"; // Ensure SizeCategory is imported
import { format } from "date-fns";

// Define the route
export const Route = createFileRoute("/bills/$billId")({
  component: BillDetailsPage,
});

// --- Utility for consistent formatting ---
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

// --- Header Component ---
function BillHeader({ bill }: { bill: BillDetails }) {
  const router = useRouter();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => billService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      navigate({ to: "/bills", replace: true });
    },
  });

  const handleDelete = () => {
    if (!window.confirm(`Delete Bill #${bill.id}? This cannot be undone.`))
      return;
    deleteMutation.mutate(bill.id);
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.history.back()}
          className="h-9 w-9 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Invoice #{bill.id}
          </h2>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>
              {format(new Date(bill.from_date), "dd MMM yyyy")} —{" "}
              {format(new Date(bill.to_date), "dd MMM yyyy")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="h-9 border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 hover:border-zinc-600 transition-all"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Invoice
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="h-9 w-9 text-rose-500 hover:text-rose-400 hover:bg-rose-950/30"
        >
          {deleteMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// --- Customer Info Card ---
function CustomerSection({ bill }: { bill: BillDetails }) {
  const { data: customer, isLoading } = useQuery({
    queryKey: ["customers", bill.customer_id],
    queryFn: () => customerService.get(bill.customer_id),
  });

  return (
    <Card className="bg-zinc-950 border-zinc-800 shadow-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          <User className="h-4 w-4" /> Bill To
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 bg-zinc-800" />
            <Skeleton className="h-4 w-48 bg-zinc-800" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Link
                to="/customers/$customerId"
                params={{ customerId: bill.customer_id.toString() }}
                className="text-xl font-semibold text-zinc-100 hover:text-emerald-400 transition-colors flex items-center gap-2 w-fit"
              >
                {customer?.name || `Customer #${bill.customer_id}`}
                <ArrowUpRight className="h-4 w-4 opacity-50" />
              </Link>
              {customer?.address && (
                <div className="mt-1 flex items-start gap-2 text-zinc-400 text-sm">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span className="leading-tight">{customer.address}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {customer?.mobile_no && (
                <div className="flex flex-col gap-1 p-2 rounded bg-zinc-900/50 border border-zinc-800/50">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">
                    Mobile
                  </span>
                  <div className="flex items-center gap-2 text-zinc-300 text-sm font-mono">
                    <Smartphone className="h-3.5 w-3.5" />
                    {customer.mobile_no}
                  </div>
                </div>
              )}
              {bill.khata_no && (
                <div className="flex flex-col gap-1 p-2 rounded bg-zinc-900/50 border border-zinc-800/50">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">
                    Khata No
                  </span>
                  <div className="flex items-center gap-2 text-zinc-300 text-sm font-mono">
                    <Hash className="h-3.5 w-3.5" />
                    {bill.khata_no}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Financial Summary Card ---
function FinancialSection({ bill }: { bill: BillDetails }) {
  const totalLabour = Object.values(bill.labour_charges).reduce(
    (a, b) => a + b,
    0,
  );
  const rentalTotal = bill.total - totalLabour;

  return (
    <Card className="bg-zinc-950 border-zinc-800 shadow-sm h-full overflow-hidden flex flex-col">
      <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 p-6 border-b border-emerald-900/20">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-emerald-500/80 text-xs font-bold uppercase tracking-wider">
              Total Amount Due
            </span>
            <h1 className="text-4xl font-bold text-white mt-1 tabular-nums tracking-tight">
              {formatCurrency(bill.total)}
            </h1>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Receipt className="h-5 w-5 text-emerald-500" />
          </div>
        </div>
      </div>

      <CardContent className="p-0 flex-1">
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" /> Material Rental
              </span>
              <span className="text-zinc-200 font-mono tabular-nums">
                {formatCurrency(rentalTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400 flex items-center gap-2">
                <Hammer className="h-3.5 w-3.5" /> Labour Charges
              </span>
              <span className="text-zinc-200 font-mono tabular-nums">
                {formatCurrency(totalLabour)}
              </span>
            </div>
          </div>

          <Separator className="bg-zinc-800 border-zinc-800 border-dashed" />

          <div className="flex items-start gap-2 text-xs text-zinc-500 bg-zinc-900/30 p-3 rounded-md">
            <Info className="h-4 w-4 shrink-0 text-zinc-600" />
            <p>
              This bill includes all service charges and applicable fees for the
              rental period.
            </p>
          </div>
        </div>
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
    <div className="space-y-4 mb-8 break-inside-avoid">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Box className="h-5 w-5 text-zinc-400" />
        Closing Stock
        <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 ml-2">
          {inventory.length}
        </Badge>
      </h3>

      <Card className="bg-zinc-950 border-zinc-800 shadow-xl shadow-black/20 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-900/50 sticky top-0 z-10">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="w-1/3 pl-6 h-10 text-zinc-500 uppercase text-xs font-bold">
                  Part Type
                </TableHead>
                <TableHead className="w-1/3 h-10 text-zinc-500 uppercase text-xs font-bold">
                  Size
                </TableHead>
                <TableHead className="w-1/3 text-right pr-6 h-10 text-zinc-500 uppercase text-xs font-bold">
                  Qty
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item, idx) => (
                <TableRow
                  key={`${item.part}-${item.size}-${idx}`}
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
                      {Number(item.size).toFixed(1)}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right pr-6 font-mono font-bold ${
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

// --- UPDATED: Ledger Table now accepts Part and Size ---
function LedgerTable({
  part,
  size,
  data,
}: {
  part: string;
  size: string;
  data: SizeCategory;
}) {
  const sizeSubtotal =
    data.lines.reduce((acc, line) => acc + line.total, 0) +
    data.initial_line.total;

  return (
    <div className="space-y-2 mb-8 break-inside-avoid">
      <div className="flex items-center gap-2 px-1">
        <Badge
          variant="outline"
          className="bg-zinc-900 text-base px-2.5 py-0.5 border-zinc-700 text-white font-mono rounded-md capitalize"
        >
          {part}
        </Badge>
        <span className="text-zinc-600 text-xs">●</span>
        <Badge
          variant="secondary"
          className="bg-zinc-800/50 text-base px-2.5 py-0.5 text-zinc-300 font-mono rounded-md"
        >
          {size}
        </Badge>
        <Separator className="flex-1 bg-zinc-800/50" />
      </div>

      <Card className="bg-zinc-950 border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-900/50">
              <TableRow className="border-zinc-800 hover:bg-transparent h-9">
                <TableHead className="w-[70px] pl-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider text-left">
                  Ref #
                </TableHead>
                <TableHead className="w-[100px] text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                  Date
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-500 text-center tracking-wider">
                  Action
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-500 text-right tracking-wider">
                  Qty
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-500 text-right tracking-wider">
                  Balance
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-500 text-right tracking-wider">
                  Days
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-500 text-right tracking-wider">
                  Service
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-500 text-right pr-4 tracking-wider">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 1. Initial Line (Opening Balance) */}
              <TableRow className="bg-zinc-900/20 border-zinc-800/50 hover:bg-zinc-900/30 h-9">
                <TableCell className="pl-4 font-mono text-zinc-600 text-xs">
                  -
                </TableCell>
                <TableCell className="font-mono text-zinc-500 text-xs">
                  {format(new Date(data.initial_line.date), "dd/MM/yy")}
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-[9px] font-semibold text-zinc-600 uppercase tracking-wider">
                    Opening
                  </span>
                </TableCell>
                <TableCell className="text-right text-zinc-600 font-mono text-xs">
                  -
                </TableCell>
                <TableCell className="text-right font-bold text-zinc-400 font-mono text-xs tabular-nums">
                  {data.initial_line.item_amount}
                </TableCell>
                <TableCell className="text-right text-zinc-400 font-mono text-xs tabular-nums">
                  {data.initial_line.days > 0 ? data.initial_line.days : "-"}
                </TableCell>
                <TableCell className="text-right text-zinc-600 font-mono text-xs">
                  -
                </TableCell>
                <TableCell className="text-right font-medium text-emerald-400 font-mono text-xs pr-4 tabular-nums">
                  {data.initial_line.total > 0
                    ? data.initial_line.total.toLocaleString()
                    : "-"}
                </TableCell>
              </TableRow>

              {/* 2. Transaction Lines */}
              {data.lines.map((line, idx) => (
                <TableRow
                  key={`${line.record_id}-${idx}`}
                  className="border-zinc-800/50 hover:bg-zinc-900/40 h-10 transition-colors"
                >
                  <TableCell className="pl-4 font-mono text-xs">
                    <Link
                      to="/records/$recordId"
                      params={{ recordId: line.record_id.toString() }}
                      className="text-zinc-500 hover:text-blue-400 hover:underline transition-colors"
                    >
                      #{line.record_id}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-zinc-300 text-xs">
                    {format(new Date(line.date), "dd/MM/yy")}
                  </TableCell>
                  <TableCell className="text-center">
                    {line.transaction_type === "OUT" ? (
                      <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-950/40 text-orange-400 border border-orange-900/30">
                        <ArrowUpRight className="h-3 w-3 mr-1" /> OUT
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">
                        <ArrowDownLeft className="h-3 w-3 mr-1" /> IN
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-zinc-300 text-xs tabular-nums">
                    {line.item_amount}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-white text-xs tabular-nums">
                    {line.total_item_amount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-zinc-400 text-xs tabular-nums">
                    {line.days > 0 ? (
                      line.days
                    ) : (
                      <span className="text-zinc-700">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-zinc-400 text-xs tabular-nums">
                    {line.service_charge > 0 ? (
                      line.service_charge
                    ) : (
                      <span className="text-zinc-700">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-emerald-400 text-xs pr-4 tabular-nums">
                    {line.total > 0 ? (
                      line.total.toLocaleString()
                    ) : (
                      <span className="text-zinc-700">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="bg-zinc-900/80 border-t border-zinc-800">
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="text-right text-xs font-bold text-zinc-400 uppercase tracking-wider h-10"
                >
                  Subtotal
                </TableCell>
                <TableCell className="text-right text-sm font-bold text-white font-mono pr-4 tabular-nums">
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
    <div className="flex-1 space-y-8 p-6 md:p-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <BillHeader bill={bill} />

      {/* Grid Layout: Customer Left, Finance Right */}
      <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2 h-auto md:h-64">
        <CustomerSection bill={bill} />
        <FinancialSection bill={bill} />
      </div>

      <div className="pt-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-1 bg-emerald-500 rounded-full" />
          <h3 className="text-lg font-semibold text-white tracking-tight">
            Rental Ledger Details
          </h3>
        </div>

        {/* UPDATED: Nested Loop for Part -> Size -> Table */}
        {Object.entries(bill.items_by_part).map(([part, sizesMap]) => (
          <div key={part} className="mb-6">
            {Object.entries(sizesMap).map(([size, data]) => (
              <LedgerTable
                key={`${part}-${size}`}
                part={part}
                size={size}
                data={data}
              />
            ))}
          </div>
        ))}

        <ClosingStockPanel inventory={bill.after_inventory} />
      </div>

      {/* Print Footer */}
      <div className="hidden print:flex flex-col items-center justify-center mt-12 pt-8 border-t border-zinc-800 text-zinc-500 text-xs">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          Jack Rental Service
        </p>
        <p>Thank you for your business.</p>
        <p className="mt-1">Generated on {format(new Date(), "PPP p")}</p>
      </div>
    </div>
  );
}
