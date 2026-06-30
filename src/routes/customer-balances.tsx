import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { customerService } from "@/services/customerService";

export const Route = createFileRoute("/customer-balances")({
  loader: async () => {
    const firstPage = await customerService.search({ page: 1, per_page: 100 });
    let customers = firstPage.data;

    if (firstPage.pagination.total_pages > 1) {
      const remainingPages = Array.from(
        { length: firstPage.pagination.total_pages - 1 },
        (_, i) => i + 2,
      );
      const resPromises = remainingPages.map((page) =>
        customerService.search({ page, per_page: 100 }),
      );
      const results = await Promise.all(resPromises);
      for (const res of results) {
        customers = customers.concat(res.data);
      }
    }

    const customersWithStats = await Promise.all(
      customers.map(async (c) => {
        try {
          const stats = await customerService.customerStats(c.id);
          return { ...c, stats };
        } catch (_e) {
          return {
            ...c,
            stats: {
              bills: { total_bill_amount: 0 },
              ledger: { total_paid: 0, total_discounted: 0, total_refunded: 0 },
            },
          };
        }
      }),
    );
    return customersWithStats;
  },
  component: CustomersBalancesPage,
});

function CustomersBalancesPage() {
  const allCustomers = Route.useLoaderData();
  const router = useRouter();

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const originalTitle = document.title;
    const titleParts = ["Customer Balances"];
    if (activeFilter !== "all") {
      titleParts.push(
        activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1),
      );
    }
    if (fromId || toId) {
      titleParts.push(`ID ${fromId || "start"} to ${toId || "end"}`);
    }
    document.title = titleParts.join(" - ");

    return () => {
      document.title = originalTitle;
    };
  }, [fromId, toId, activeFilter]);

  const filteredCustomers = allCustomers
    .filter((c) => {
      if (activeFilter === "active" && !c.active) return false;
      if (activeFilter === "inactive" && c.active) return false;

      const from = parseInt(fromId, 10);
      const to = parseInt(toId, 10);

      if (!Number.isNaN(from) && c.id < from) return false;
      if (!Number.isNaN(to) && c.id > to) return false;

      return true;
    })
    .sort((a, b) => a.id - b.id);

  const handleReset = () => {
    setFromId("");
    setToId("");
    setActiveFilter("all");
  };

  const formatMoney = (amount: number | null | undefined) => {
    return (amount || 0).toFixed(2);
  };

  return (
    <div className="bg-slate-100 text-slate-900 min-h-screen p-4 sm:p-8 font-sans print:p-0 print:bg-white print:min-h-0 print:h-auto">
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            table {
              font-size: 10px !important;
            }
            th, td {
              padding-left: 4px !important;
              padding-right: 4px !important;
              padding-top: 6px !important;
              padding-bottom: 6px !important;
            }
          }
        `}
      </style>

      {/* Control Panel */}
      <div className="max-w-[1200px] mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.history.go(-1)}
            className="h-9 w-9 border-slate-300 text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-800">
              Customer Balances
            </h1>
            <p className="text-xs text-slate-500">View outstandings</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              From ID:
            </span>
            <Input
              type="number"
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="w-24 h-8 text-sm"
              placeholder="e.g. 1"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">To ID:</span>
            <Input
              type="number"
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-24 h-8 text-sm"
              placeholder="e.g. 100"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Status:
            </span>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(fromId || toId || activeFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 cursor-pointer"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
            </Button>
          )}

          <Button
            onClick={() => window.print()}
            size="sm"
            className="bg-slate-800 text-white hover:bg-slate-700 font-semibold cursor-pointer"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
          </Button>
        </div>
      </div>

      {/* Main Printable Area */}
      <div className="max-w-[1200px] mx-auto border-2 border-slate-800 bg-white shadow-2xl print:shadow-none flex flex-col leading-normal print:min-h-[190mm]">
        <div className="bg-slate-200 border-b-2 border-slate-800 font-extrabold text-sm px-4 py-3 uppercase tracking-widest text-slate-900 flex justify-between items-center">
          <span>Customer Balances</span>
          <span className="text-[10px] text-slate-600">
            {activeFilter === "all"
              ? "All Customers"
              : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Customers`}
            {fromId || toId ? ` | ID: ${fromId || "*"} to ${toId || "*"}` : ""}
          </span>
        </div>

        <div className="grow">
          <Table className="w-full text-xs text-center border-collapse">
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b-2 border-slate-800 hover:bg-slate-50">
                <TableHead className="border-r border-slate-400 py-3 px-3 text-center font-bold text-slate-800 uppercase w-16">
                  ID
                </TableHead>
                <TableHead className="border-r border-slate-400 py-3 px-4 text-left font-bold text-slate-800 uppercase w-64">
                  Name
                </TableHead>
                <TableHead className="border-r border-slate-400 py-3 px-4 text-left font-bold text-slate-800 uppercase w-32">
                  Mobile No
                </TableHead>
                <TableHead className="border-r border-slate-400 py-3 px-3 text-right font-bold text-indigo-900 uppercase">
                  Total Bill
                </TableHead>
                <TableHead className="border-r border-slate-400 py-3 px-3 text-right font-bold text-emerald-700 uppercase">
                  Total Paid
                </TableHead>
                <TableHead className="border-r border-slate-400 py-3 px-3 text-right font-bold text-amber-600 uppercase">
                  Total Discount
                </TableHead>
                <TableHead className="py-3 px-4 text-right font-bold text-rose-700 uppercase">
                  Outstanding
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const totalBill = customer.stats?.bills?.total_bill_amount || 0;
                const totalPaid = customer.stats?.ledger?.total_paid || 0;
                const totalDiscount =
                  customer.stats?.ledger?.total_discounted || 0;
                const outstanding = totalBill - totalPaid - totalDiscount;

                return (
                  <TableRow
                    key={customer.id}
                    className="border-b border-slate-300 hover:bg-slate-50/50 transition-colors last:border-b-0"
                  >
                    <TableCell className="border-r border-slate-300 py-2 px-3 font-bold text-slate-700 text-center">
                      <Link
                        to="/customers/$customerId"
                        params={{ customerId: customer.id.toString() }}
                        className="hover:underline hover:text-emerald-600 transition-colors"
                      >
                        {customer.id}
                      </Link>
                    </TableCell>
                    <TableCell className="border-r border-slate-300 py-2 px-4 text-left font-bold text-slate-900">
                      <Link
                        to="/customers/$customerId"
                        params={{ customerId: customer.id.toString() }}
                        className="hover:underline hover:text-emerald-600 transition-colors"
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell className="border-r border-slate-300 py-2 px-4 text-left text-slate-600">
                      {customer.mobile_no || "-"}
                    </TableCell>
                    <TableCell className="border-r border-slate-300 py-2 px-3 text-right font-semibold text-indigo-700">
                      {formatMoney(totalBill)}
                    </TableCell>
                    <TableCell className="border-r border-slate-300 py-2 px-3 text-right font-semibold text-emerald-700">
                      {formatMoney(totalPaid)}
                    </TableCell>
                    <TableCell className="border-r border-slate-300 py-2 px-3 text-right font-medium text-amber-600">
                      {formatMoney(totalDiscount)}
                    </TableCell>
                    <TableCell className="py-2 px-4 text-right font-bold text-rose-700">
                      {formatMoney(outstanding)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-slate-500 font-medium"
                  >
                    No customers found matching the criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
