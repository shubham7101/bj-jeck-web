import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Truck,
  User,
  Wrench,
  Smartphone,
  Trash,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Package,
  AlertCircle,
  IndianRupee,
  Layers,
  MapPin,
  FileText,
  Edit,
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
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { recordService } from "@/services/recordService";
import { customerService } from "@/services/customerService";
import type { RecordDetails, RecordItem } from "@/schemas/recordSchema";
import type { Customer } from "@/schemas/customerSchema";

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
          className="h-9 w-9 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Record #{record.id}
            <Badge
              variant="outline"
              className={`
                ml-2 px-2.5 py-0.5 rounded-full border text-xs font-medium flex items-center gap-1
                ${
                  isTypeIn
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                }
              `}
            >
              {isTypeIn ? (
                <ArrowDownLeft className="h-3 w-3" />
              ) : (
                <ArrowUpRight className="h-3 w-3" />
              )}
              {record.transaction_type}
            </Badge>
          </h2>
          <p className="text-sm text-zinc-500 flex items-center gap-2 mt-1">
            <Calendar className="h-3 w-3" />
            {record.date}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
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
    <Card className="bg-zinc-950 border-zinc-800 shadow-lg shadow-black/20 h-full">
      <CardHeader className="pb-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-zinc-900 rounded-md border border-zinc-800">
            <Truck className="h-4 w-4 text-blue-500" />
          </div>
          <CardTitle className="text-base font-medium text-zinc-200">
            Transport & Customer
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Customer Detail Section */}
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <User className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="space-y-1 w-full">
            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">
              Linked Customer
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-primary">
                  {customer
                    ? `#${customer.id}  ${customer.name}`
                    : `Customer #${record.customer_id}`}
                </p>
                <Link
                  to="/customers/$customerId"
                  params={{ customerId: record.customer_id.toString() }}
                  className="p-2 hover:bg-zinc-800/40 rounded-full transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4 text-zinc-600" />
                </Link>
              </div>

              {/* Added Customer Details */}
              {customer && (
                <div className="text-sm text-zinc-400 space-y-1 mt-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-zinc-600" />
                    <span>{customer.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-3 w-3 text-zinc-600" />
                    <span className="font-mono">{customer.mobile_no}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-zinc-800" />

        {/* Vehicle Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-zinc-500">
              <Truck className="h-3 w-3" />
              <span className="text-xs uppercase font-bold">Vehicle No</span>
            </div>
            <p className="text-zinc-200 font-medium font-mono">
              {record.vehicle_no || "N/A"}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-zinc-500">
              <Smartphone className="h-3 w-3" />
              <span className="text-xs uppercase font-bold">
                Driver Contact
              </span>
            </div>
            <p className="text-zinc-200 font-medium font-mono">
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
    <Card className="bg-zinc-950 border-zinc-800 shadow-lg shadow-black/20 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-zinc-900 rounded-md border border-zinc-800">
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </div>
          <CardTitle className="text-base font-medium text-zinc-200">
            Summary
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Labour Charge */}
          <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              <Wrench className="h-4 w-4" />
              <span className="text-xs uppercase font-bold">Labour</span>
            </div>
            <span className="text-2xl font-bold text-emerald-400">
              ₹{record.labour_charge.toLocaleString()}
            </span>
          </div>

          {/* Total Items */}
          <div className="p-4 rounded-lg bg-blue-950/10 border border-blue-900/20">
            <div className="flex items-center gap-2 mb-2 text-blue-500">
              <Layers className="h-4 w-4" />
              <span className="text-xs uppercase font-bold">Total Items</span>
            </div>
            <span className="text-2xl font-bold text-blue-400">
              {record.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* --- NEW: Bill Status Section --- */}
        <div className="mt-auto space-y-4">
          <div className="pt-4 border-t border-zinc-800/50">
            {record.bill_id ? (
              // Case: Record is Billed -> Show Link
              <div className="flex items-center justify-between p-3 rounded-md bg-emerald-950/20 border border-emerald-900/30 group hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-900/30 p-2 rounded-full">
                    <FileText className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-emerald-600/80 tracking-wider">
                      Included in Bill
                    </span>
                    <span className="text-sm font-semibold text-emerald-100">
                      Invoice #{record.bill_id}
                    </span>
                  </div>
                </div>
                <Link
                  to="/bills/$billId"
                  params={{ billId: record.bill_id.toString() }}
                  className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 rounded-full transition-colors"
                  title="View Bill"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              // Case: Record is Unbilled -> Show Status
              <div className="flex items-center gap-3 p-3 rounded-md bg-zinc-900/40 border border-zinc-800/60 border-dashed">
                <div className="bg-zinc-800/50 p-2 rounded-full">
                  <AlertCircle className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">
                    Billing Status
                  </span>
                  <span className="text-sm font-medium text-zinc-400">
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
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Package className="h-5 w-5 text-zinc-400" />
        Record Items
        <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 ml-2">
          {items.length}
        </Badge>
      </h3>
      <Card className="bg-zinc-950 border-zinc-800 shadow-xl shadow-black/20 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-900/50">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="w-24 h-10 text-zinc-500 uppercase text-xs font-bold text-center">
                  ID
                </TableHead>
                <TableHead className="h-10 text-zinc-500 uppercase text-xs font-bold text-center">
                  Part Details
                </TableHead>
                <TableHead className="h-10 text-zinc-500 uppercase text-xs font-bold text-center">
                  Size
                </TableHead>
                <TableHead className="h-10 text-zinc-500 uppercase text-xs font-bold text-center">
                  Quantity
                </TableHead>
                <TableHead className="h-10 text-zinc-500 uppercase text-xs font-bold text-center">
                  Broken
                </TableHead>
                <TableHead className="h-10 text-zinc-500 uppercase text-xs font-bold text-center">
                  Total
                </TableHead>
                <TableHead className="h-10 text-zinc-500 uppercase text-xs font-bold text-center">
                  Service Charge
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-zinc-800 hover:bg-zinc-900/40 transition-colors group"
                >
                  <TableCell className="font-mono text-zinc-500 text-xs text-center">
                    #{item.id.toString().padStart(4, "0")}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium text-zinc-200 capitalize">
                      {item.part}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className="bg-zinc-900 border-zinc-700 text-zinc-400 font-normal font-mono mx-auto"
                    >
                      {item.size.toFixed(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-lg text-zinc-100">
                      {item.item_amount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`font-bold text-lg ${
                        item.broken_amount === 0
                          ? "text-zinc-100"
                          : "text-rose-500"
                      }`}
                    >
                      {item.broken_amount === 0
                        ? "-"
                        : item.broken_amount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-lg text-zinc-100">
                      {(item.item_amount + item.broken_amount).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold text-lg text-emerald-400`}>
                      ₹{item.service_charge.toLocaleString()}
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
    queryFn: () => customerService.get(record!.customer_id),
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
    <div className="flex-1 space-y-8 p-8 pt-6 animate-in fade-in duration-500">
      <RecordHeader record={record} />

      <div className="grid gap-6 md:grid-cols-2">
        <GeneralInfoCard record={record} customer={customer} />
        <FinancialInfoCard record={record} />
      </div>

      <RecordItemsTable items={record.items} />
    </div>
  );
}
