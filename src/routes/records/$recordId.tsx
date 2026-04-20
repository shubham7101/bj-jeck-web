import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Edit,
  FileText,
  IndianRupee,
  Layers,
  Loader2,
  MapPin,
  Package,
  Printer,
  Smartphone,
  Trash,
  Truck,
  User,
  Wrench,
} from "lucide-react";
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
import type { Customer } from "@/schemas/customerSchema";
import type { RecordDetails, RecordItem } from "@/schemas/recordSchema";
import { customerService } from "@/services/customerService";
import { recordService } from "@/services/recordService";
import { formatCurrency } from "@/utils";

// Define the route
export const Route = createFileRoute("/records/$recordId")({
  component: RecordDetailsPage,
});

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
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.history.back()}
          className="h-9 w-9 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer print:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-3 print:text-black">
            Record #{record.id}
            <Badge
              variant="outline"
              className={`
                ml-2 px-2.5 py-0.5 rounded-full border text-xs font-medium flex items-center gap-1
                print:bg-transparent print:border-black print:text-black
                ${
                  isTypeIn
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                }
              `}
            >
              {isTypeIn ? (
                <ArrowDownLeft className="h-3 w-3 print:hidden" />
              ) : (
                <ArrowUpRight className="h-3 w-3 print:hidden" />
              )}
              {record.transaction_type}
            </Badge>
          </h2>
          <p className="text-sm text-zinc-500 flex items-center gap-2 mt-1 print:text-zinc-600">
            <Calendar className="h-3 w-3" />
            {record.date}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 print:hidden">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="h-9 border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:text-white hover:bg-zinc-700 hover:border-zinc-600 transition-all cursor-pointer"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Link
          to="/records/update/$recordId"
          params={{ recordId: record.id.toString() }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            title={
              isBilled
                ? "Cannot update: Record is included in a bill"
                : "Update Record"
            }
          >
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDelete}
          // Disable if mutation is pending OR if record is billed
          disabled={deleteMutation.isPending || isBilled}
          title={
            isBilled
              ? "Cannot delete: Record is included in a bill"
              : "Delete Record"
          }
          className={`
            h-10 w-10 transition-colors
            ${
              isBilled
                ? "opacity-50 cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-500" // Disabled Style
                : "text-zinc-500 hover:text-rose-500 hover:bg-rose-950/20 transition-colors cursor-pointer" // Active Style
            }
          `}
        >
          {deleteMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Trash className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}

function GeneralInfoCard({
  record,
  customer,
}: {
  record: RecordDetails;
  customer: Customer | undefined;
}) {
  return (
    <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl h-full flex flex-col relative overflow-hidden print:bg-white print:border-zinc-300 print:shadow-none">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400/50 print:hidden" />
      <CardHeader className="pb-3 border-b border-zinc-800/50 bg-zinc-900/50 print:bg-transparent print:border-zinc-300">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-zinc-950 rounded-md border border-zinc-800 shadow-sm print:hidden">
            <Truck className="h-4 w-4 text-blue-500" />
          </div>
          <CardTitle className="text-base font-medium text-zinc-200 print:text-black">
            Transport & Customer
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-6 flex-1">
        {/* Customer Detail Section */}
        <div className="flex items-start gap-3">
          <div className="mt-1 print:hidden">
            <User className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="space-y-1 w-full">
            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider print:text-zinc-600">
              Linked Customer
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-primary print:text-black">
                  {customer
                    ? `#${customer.id}  ${customer.name}`
                    : `Customer #${record.customer_id}`}
                </p>
                <Link
                  to="/customers/$customerId"
                  params={{ customerId: record.customer_id.toString() }}
                  className="p-2 hover:bg-zinc-800/40 rounded-full transition-colors print:hidden"
                >
                  <ArrowUpRight className="h-4 w-4 text-zinc-600" />
                </Link>
              </div>

              {/* Added Customer Details */}
              {customer && (
                <div className="text-sm text-zinc-400 space-y-1.5 mt-2 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 print:bg-transparent print:border-none print:text-black print:p-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-zinc-500 print:text-zinc-600" />
                    <span>{customer.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-3 w-3 text-zinc-600 print:text-zinc-600" />
                    <span className="font-mono">{customer.mobile_no}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-zinc-800 print:bg-zinc-300" />

        {/* Vehicle Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-zinc-500 print:text-zinc-600">
              <Truck className="h-3 w-3" />
              <span className="text-xs uppercase font-bold">Vehicle No</span>
            </div>
            <p className="text-zinc-200 font-medium font-mono print:text-black">
              {record.vehicle_no || "N/A"}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-zinc-500 print:text-zinc-600">
              <Smartphone className="h-3 w-3" />
              <span className="text-xs uppercase font-bold">
                Driver Contact
              </span>
            </div>
            <p className="text-zinc-200 font-medium font-mono print:text-black">
              {record.vehicle_mobile_no || "N/A"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialInfoCard({ record }: { record: RecordDetails }) {
  return (
    <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl h-full flex flex-col relative overflow-hidden print:bg-white print:border-zinc-300 print:shadow-none">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400/50 print:hidden" />
      <CardHeader className="pb-3 border-b border-zinc-800/50 bg-zinc-900/50 print:bg-transparent print:border-zinc-300">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-zinc-950 rounded-md border border-zinc-800 shadow-sm print:hidden">
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </div>
          <CardTitle className="text-base font-medium text-zinc-200 print:text-black">
            Summary
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Labour Charge */}
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50 relative overflow-hidden shadow-sm group print:bg-transparent print:border-zinc-300">
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
            <div className="flex items-center gap-2 mb-2 text-zinc-500 print:text-zinc-600">
              <Wrench className="h-4 w-4 text-zinc-400 group-hover:text-emerald-400 transition-colors print:hidden" />
              <span className="text-xs uppercase font-bold tracking-wider">
                Labour
              </span>
            </div>
            <span className="text-3xl font-bold text-emerald-400 font-mono tracking-tight drop-shadow-[0_0_10px_rgba(52,211,153,0.2)] print:text-black print:drop-shadow-none">
              {formatCurrency(record.labour_charge)}
            </span>
          </div>

          {/* Transport Charge */}
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50 relative overflow-hidden shadow-sm group print:bg-transparent print:border-zinc-300">
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
            <div className="flex items-center gap-2 mb-2 text-zinc-500 print:text-zinc-600">
              <Truck className="h-4 w-4 text-zinc-400 group-hover:text-purple-400 transition-colors print:hidden" />
              <span className="text-xs uppercase font-bold tracking-wider">
                Transport
              </span>
            </div>
            <span className="text-3xl font-bold text-purple-400 font-mono tracking-tight drop-shadow-[0_0_10px_rgba(168,85,247,0.2)] print:text-black print:drop-shadow-none">
              {formatCurrency(record.transport_charge)}
            </span>
          </div>

          {/* Total Items */}
          <div className="col-span-2 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50 relative overflow-hidden shadow-sm group print:bg-transparent print:border-zinc-300 print:col-span-2">
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
            <div className="flex items-center gap-2 mb-2 text-zinc-500 print:text-zinc-600">
              <Layers className="h-4 w-4 text-zinc-400 group-hover:text-blue-400 transition-colors print:hidden" />
              <span className="text-xs uppercase font-bold tracking-wider">
                Total Items
              </span>
            </div>
            <span className="text-3xl font-bold text-blue-400 font-mono tracking-tight drop-shadow-[0_0_10px_rgba(96,165,250,0.2)] print:text-black print:drop-shadow-none">
              {record.total}
            </span>
          </div>
        </div>

        {/* --- NEW: Bill Status Section --- */}
        <div className="mt-auto space-y-4 print:hidden">
          <div className="pt-4 border-t border-zinc-800/50">
            {record.bill_id ? (
              // Case: Record is Billed -> Show Link
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/30 to-emerald-900/10 border border-emerald-900/30 group hover:border-emerald-500/40 transition-all shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-800/50 shadow-inner">
                    <FileText className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-emerald-500/80 tracking-widest">
                      Included in Bill
                    </span>
                    <span className="text-sm font-semibold text-emerald-100 flex items-center gap-1.5">
                      Invoice{" "}
                      <span className="text-emerald-400">
                        #{record.bill_id}
                      </span>
                    </span>
                  </div>
                </div>
                <Link
                  to="/bills/$billId"
                  params={{ billId: record.bill_id.toString() }}
                  className="p-2.5 text-emerald-500 hover:text-emerald-300 hover:bg-emerald-950 rounded-lg transition-colors border border-transparent hover:border-emerald-800/50 shadow-sm"
                  title="View Bill"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              // Case: Record is Unbilled -> Show Status
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60 border-dashed hover:bg-zinc-900/50 transition-colors">
                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                  <AlertCircle className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                    Billing Status
                  </span>
                  <span className="text-sm font-medium text-zinc-300">
                    Unbilled Record
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-zinc-600 text-center">
            *Total Items represents the count of units.
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
        <Package className="h-5 w-5 text-emerald-500 print:hidden" />
        Record Items
        <Badge
          variant="outline"
          className="bg-zinc-900/80 text-zinc-400 border-zinc-800 ml-2 print:bg-white print:text-black print:border-black"
        >
          {items.length} {items.length === 1 ? "Item" : "Items"}
        </Badge>
      </h3>
      <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm shadow-xl overflow-hidden print:bg-white print:border-zinc-300 print:shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-950/50 block w-full print:bg-zinc-100">
              <TableRow className="border-zinc-800/80 hover:bg-transparent flex w-full print:border-zinc-300">
                <TableHead className="w-[20%] pl-6 text-zinc-400 uppercase text-xs font-bold flex items-center print:text-black">
                  Part Details
                </TableHead>
                <TableHead className="w-[15%] text-zinc-400 uppercase text-xs font-bold text-center flex items-center justify-center print:text-black">
                  Size
                </TableHead>
                <TableHead className="w-[15%] text-zinc-400 uppercase text-xs font-bold text-center flex items-center justify-center print:text-black">
                  Quantity
                </TableHead>
                <TableHead className="w-[15%] text-zinc-400 uppercase text-xs font-bold text-center flex items-center justify-center print:text-black">
                  Broken
                </TableHead>
                <TableHead className="w-[10%] text-zinc-400 uppercase text-xs font-bold text-center flex items-center justify-center print:text-black">
                  Total
                </TableHead>
                <TableHead className="w-[15%] text-zinc-400 uppercase text-xs font-bold pr-6 text-right flex items-center justify-end print:text-black">
                  Service Charge
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-800/50 block w-full print:divide-zinc-300">
              {items.map((item) => (
                <TableRow
                  key={`${item.part}-${item.size}`}
                  className="border-none hover:bg-zinc-900/40 transition-colors group flex w-full print:hover:bg-transparent"
                >
                  <TableCell className="w-[20%] pl-6 flex items-center py-4">
                    <span className="font-medium text-zinc-200 capitalize print:text-black">
                      {item.part}
                    </span>
                  </TableCell>
                  <TableCell className="w-[15%] flex items-center justify-center py-4">
                    <Badge
                      variant="outline"
                      className="bg-zinc-950/50 border-zinc-800 text-zinc-400 font-normal font-mono px-2 py-0.5 print:bg-white print:text-black print:border-zinc-400"
                    >
                      {item.size}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[15%] flex items-center justify-center py-4">
                    <span className="font-semibold text-base text-zinc-200 print:text-black">
                      {item.item_amount}
                    </span>
                  </TableCell>
                  <TableCell className="w-[15%] flex items-center justify-center py-4">
                    <span
                      className={`font-semibold text-base ${
                        item.broken_amount === 0
                          ? "text-zinc-500 print:text-zinc-500"
                          : "text-rose-400 print:text-rose-600"
                      }`}
                    >
                      {item.broken_amount === 0 ? "-" : item.broken_amount}
                    </span>
                  </TableCell>
                  <TableCell className="w-[10%] flex items-center justify-center py-4">
                    <span className="font-bold text-base text-zinc-100 print:text-black">
                      {item.item_amount + item.broken_amount}
                    </span>
                  </TableCell>
                  <TableCell className="w-[15%] pr-6 flex items-center justify-end py-4">
                    <span
                      className={`font-bold text-base text-emerald-400 font-mono tracking-tight print:text-black`}
                    >
                      {formatCurrency(item.service_charge || 0)}
                    </span>
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

// --- Main Page Component ---

function RecordDetailsPage() {
  const { recordId } = Route.useParams();
  const navigate = Route.useNavigate();

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
      <div className="flex-1 space-y-6 p-8 pt-6">
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
          onClick={() => navigate({ to: "/records" })}
          className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 animate-in fade-in duration-500 print:p-0 print:max-w-none">
      <RecordHeader record={record} />

      <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">
        <GeneralInfoCard record={record} customer={customer} />
        <FinancialInfoCard record={record} />
      </div>

      <RecordItemsTable items={record.items} />
    </div>
  );
}
