import { createRoute, useRouter } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import { format, isValid, parse } from "date-fns";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Printer,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { billService } from "@/services/billService";
import { customerService } from "@/services/customerService";
import { ledgerService } from "@/services/ledgerService";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers/statement/$customerId",
  loader: async ({ params }) => {
    const customerId = Number(params.customerId);
    const customer = await customerService.get(customerId);

    // Fetch all bills and payment ledger entries (large per_page to ensure we load history)
    const billsRes = await billService.search({
      customer_id: customerId,
      per_page: 100,
    });
    const paymentsRes = await ledgerService.search({
      customer_id: customerId,
      per_page: 100,
    });

    return {
      customer,
      bills: billsRes.data || [],
      payments: paymentsRes.data || [],
    };
  },
  component: StatementPage,
});

type TransactionItem = {
  date: Date;
  dateStr: string;
  remarks: string;
  billAmount: number;
  credit: number;
};

const DATE_FORMAT = "dd-MM-yyyy";

function StatementPage() {
  const { customer, bills, payments } = Route.useLoaderData();
  const router = useRouter();

  // Local filter states
  const [fromDateStr, setFromDateStr] = useState<string>("");
  const [toDateStr, setToDateStr] = useState<string>("");

  const fromDate =
    fromDateStr && isValid(parse(fromDateStr, DATE_FORMAT, new Date()))
      ? parse(fromDateStr, DATE_FORMAT, new Date())
      : undefined;

  const toDate =
    toDateStr && isValid(parse(toDateStr, DATE_FORMAT, new Date()))
      ? parse(toDateStr, DATE_FORMAT, new Date())
      : undefined;

  // Set document title for printing filenames
  useEffect(() => {
    if (customer) {
      document.title = `ledger-${customer.id}-${customer.name}`;
    }
  }, [customer]);

  // Transform bills into transaction items (Bills represent receivables/credits)
  const billItems: TransactionItem[] = bills.map((bill) => {
    const date = new Date(bill.to_date);
    return {
      date,
      dateStr: format(date, "dd/MM/yy"),
      remarks: `BILL NO - ${bill.id} | FROM ${format(new Date(bill.from_date), "dd-MM-yy")} TO ${format(new Date(bill.to_date), "dd-MM-yy")}`,
      billAmount: bill.total,
      credit: 0,
    };
  });

  // Transform received payments into transaction items (Payments represent credits received/debits)
  const paymentItems: TransactionItem[] = payments.map((pay) => {
    const date = new Date(pay.date);
    return {
      date,
      dateStr: format(date, "dd/MM/yy"),
      remarks: `REF NO. ${pay.id} | ${pay.type ? pay.type.toUpperCase() : "PAYMENT"} | ${pay.notes}`,
      billAmount: 0,
      credit: pay.amount,
    };
  });

  // Combine and sort chronologically
  const allItems = [...billItems, ...paymentItems].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // Compute Filtered List
  const filteredItems: TransactionItem[] = [];

  for (const item of allItems) {
    const isBeforeFrom = fromDate ? item.date < fromDate : false;
    const isAfterTo = toDate ? item.date > toDate : false;

    if (!isBeforeFrom && !isAfterTo) {
      filteredItems.push(item);
    }
  }

  // Calculate running balances starting from 0
  let runningBalance = 0;
  const rows = filteredItems.map((item) => {
    runningBalance += item.billAmount - item.credit;
    return {
      ...item,
      balance: runningBalance,
    };
  });

  // Totals
  const totalBillAmount = filteredItems.reduce(
    (sum, item) => sum + item.billAmount,
    0,
  );
  const totalCreditAmount = filteredItems.reduce(
    (sum, item) => sum + item.credit,
    0,
  );
  const closingBalance = runningBalance;

  // Dynamic fallback bounds for From & To Dates when no manual filters are active
  const firstTxDate =
    allItems.length > 0
      ? allItems[0].date
      : customer.joined_date
        ? new Date(customer.joined_date)
        : new Date();
  const lastTxDate =
    allItems.length > 0 ? allItems[allItems.length - 1].date : new Date();

  const displayFromDate = fromDateStr
    ? fromDateStr
    : format(firstTxDate, "dd-MM-yyyy");

  const displayToDate = toDateStr
    ? toDateStr
    : format(lastTxDate, "dd-MM-yyyy");

  const formatLedgerAmount = (num: number) => {
    return num === 0 ? "" : num.toFixed(2);
  };

  const formatBalance = (amount: number) => {
    if (amount === 0) return "0.00";
    return `${amount.toFixed(2)}`;
  };

  const handleReset = () => {
    setFromDateStr("");
    setToDateStr("");
  };

  return (
    <div className="bg-slate-100 text-slate-900 min-h-screen p-4 sm:p-8 font-sans print:p-0 print:bg-white print:min-h-0 print:h-auto">
      <style>
        {`
          @page {
            size: A4;
            margin: 10mm;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
          }
        `}
      </style>

      {/* Control Panel (Screen only) */}
      <div className="max-w-[1000px] mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
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
              Ledger Statement
            </h1>
            <p className="text-xs text-slate-500">{customer.name}</p>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">From:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-36 justify-start text-left font-normal border-slate-300",
                    !fromDateStr && "text-slate-400",
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                  {fromDateStr ? fromDateStr : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={(date) =>
                    setFromDateStr(date ? format(date, DATE_FORMAT) : "")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">To:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-36 justify-start text-left font-normal border-slate-300",
                    !toDateStr && "text-slate-400",
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                  {toDateStr ? toDateStr : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={(date) =>
                    setToDateStr(date ? format(date, DATE_FORMAT) : "")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {(fromDateStr || toDateStr) && (
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
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Ledger
          </Button>
        </div>
      </div>

      {/* Main Printable Ledger Document */}
      <div className="max-w-[1000px] mx-auto border-2 border-slate-800 bg-white shadow-2xl print:shadow-none flex flex-col print:min-h-[277mm] leading-normal">
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 p-3">
          <div className="flex items-center justify-start">
            {/* Logo area */}
            <div className="h-14 w-14 flex flex-col items-center justify-center font-extrabold text-slate-800 border-2 border-slate-800 rounded-lg overflow-hidden bg-slate-50">
              <span className="text-xl tracking-tighter leading-none">BG</span>
              <span className="text-[6px] tracking-widest uppercase mt-0.5 leading-none">
                JECK
              </span>
            </div>
          </div>

          <table className="ml-auto text-[10px] text-left">
            <tbody>
              <tr>
                <td className="font-bold text-slate-800 tracking-widest uppercase pr-2 py-0.5 whitespace-nowrap">
                  Mobile No :
                </td>
                <td className="font-semibold text-slate-600 tracking-wide py-0.5">
                  <div className="flex gap-2 whitespace-nowrap">
                    <span>+91-9727710022,</span>
                    <span>+91-9904515022,</span>
                    <span>+91-7383073894,</span>
                    <span>+91-8200951702</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="font-bold text-slate-800 tracking-widest uppercase pr-2 py-0.5 whitespace-nowrap">
                  Address :
                </td>
                <td className="font-semibold text-slate-600 tracking-wider py-0.5">
                  Company Address Here
                </td>
              </tr>
              <tr>
                <td className="font-bold text-slate-800 tracking-widest uppercase pr-2 py-0.5 whitespace-nowrap">
                  E-mail :
                </td>
                <td className="font-semibold text-slate-600 tracking-wider py-0.5">
                  manishdhameliya21031978@gmail.com
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Info Details Section */}
        <div className="flex border-b-2 border-slate-800">
          {/* Customer Left */}
          <div className="w-3/5 border-r-2 border-slate-800 p-2.5 flex flex-col justify-between bg-slate-50/50">
            <div className="flex flex-col gap-1">
              <div className="font-extrabold text-sm uppercase text-slate-900 tracking-wide leading-none">
                NAME : {customer.name}
              </div>
              <div className="text-[11px] font-bold uppercase leading-snug max-w-[90%] text-slate-700">
                ADDRESS : {customer.address}
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-0.5">
              <div className="text-[11px] font-bold flex gap-3 text-slate-800">
                <span className="w-24 tracking-wider">CUSTOMER ID</span>
                <span className="font-semibold text-slate-600">
                  : {customer.id}
                </span>
              </div>
              <div className="text-[11px] font-bold flex gap-3 text-slate-800">
                <span className="w-24 tracking-wider">MOBILE NO</span>
                <span className="font-semibold text-slate-600">
                  : {customer.mobile_no}
                </span>
              </div>
              <div className="text-[11px] font-bold flex gap-3 text-slate-800">
                <span className="w-24 tracking-wider">GSTIN</span>
                <span className="font-semibold text-slate-600">:</span>
              </div>
            </div>
          </div>

          {/* Bill Info Right */}
          <div className="w-2/5 p-2.5 flex flex-col justify-center gap-1.5 text-[11px] font-bold bg-white">
            <div className="flex justify-between items-center border-b border-slate-300 pb-0.5">
              <span className="text-slate-500 tracking-wider">DOCUMENT</span>
              <span className="text-slate-900">ACCOUNT STATEMENT</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-300 pb-0.5">
              <span className="text-slate-500 tracking-wider">FROM DATE</span>
              <span className="text-slate-900">{displayFromDate}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-300 pb-0.5">
              <span className="text-slate-500 tracking-wider">TO DATE</span>
              <span className="text-slate-900">{displayToDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 tracking-wider">
                GENERATED ON
              </span>
              <span className="text-slate-900">
                {format(new Date(), "dd-MM-yyyy HH:mm:ss")}
              </span>
            </div>
          </div>
        </div>

        {/* Ledger Head title */}
        <div className="bg-slate-200 border-b-2 border-slate-800 font-extrabold text-xs px-4 py-2 uppercase tracking-widest text-slate-900 flex justify-between items-center">
          <span>Ledger Statement: {customer.name}</span>
          <span className="text-[10px] text-slate-600">
            {fromDateStr && toDateStr
              ? `${fromDateStr} to ${toDateStr}`
              : "All Records"}
          </span>
        </div>

        {/* Table Area */}
        <div className="grow">
          <Table className="w-full text-[10px] text-center border-collapse">
            <TableHeader className="bg-white">
              <TableRow className="border-b-2 border-slate-800 hover:bg-white">
                <TableHead className="border-r border-slate-400 py-1.5 px-2 h-auto text-center font-bold text-slate-800 uppercase tracking-wider w-[12%]">
                  Date
                </TableHead>
                <TableHead className="border-r border-slate-400 py-1.5 px-3 h-auto text-left font-bold text-slate-800 uppercase tracking-wider w-[50%]">
                  Remarks
                </TableHead>
                <TableHead className="border-r border-slate-400 py-1.5 px-2 h-auto text-right font-bold text-slate-800 uppercase tracking-wider w-[12%]">
                  Bill Amount
                </TableHead>
                <TableHead className="border-r border-slate-400 py-1.5 px-2 h-auto text-right font-bold text-slate-800 uppercase tracking-wider w-[12%]">
                  Credit
                </TableHead>
                <TableHead className="py-1.5 px-3 h-auto text-right font-extrabold text-slate-950 uppercase tracking-wider w-[14%] bg-slate-50/50">
                  Balance
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Transactions Rows */}
              {rows.map((row, i) => (
                <TableRow
                  key={i}
                  className="border-b border-slate-300 hover:bg-transparent transition-colors last:border-b-0"
                >
                  <TableCell className="border-r border-slate-300 py-1 px-2 font-semibold text-slate-600">
                    {format(row.date, "dd/MM/yy")}
                  </TableCell>
                  <TableCell className="border-r border-slate-300 py-1 px-3 text-left whitespace-pre-line font-medium text-slate-800">
                    {row.remarks}
                  </TableCell>
                  <TableCell className="border-r border-slate-300 py-1 px-2 text-right font-bold text-indigo-900">
                    {formatLedgerAmount(row.billAmount)}
                  </TableCell>
                  <TableCell className="border-r border-slate-300 py-1 px-2 text-right font-bold text-emerald-700">
                    {formatLedgerAmount(row.credit)}
                  </TableCell>
                  <TableCell className="py-1 px-3 text-right font-bold text-slate-950 bg-slate-50/50">
                    {formatBalance(row.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer Totals */}
        <div className="flex border-t-2 border-slate-800 break-inside-avoid">
          {/* Signatures */}
          <div className="w-[50%] border-r-2 border-slate-800 flex flex-col justify-between p-3 bg-slate-50/20">
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
              Terms & Verification
            </div>
            <div className="mt-8 flex justify-between px-2 text-[9px] font-extrabold text-slate-700">
              <div className="border-t border-dashed border-slate-500 pt-1 w-24 text-center">
                Prepared By
              </div>
              <div className="border-t border-dashed border-slate-500 pt-1 w-24 text-center">
                Verified By
              </div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="w-[50%] flex flex-col bg-white text-[10px] font-bold">
            <div className="flex justify-between items-center p-2 border-b border-slate-300">
              <span className="text-slate-500 tracking-wider">
                TOTAL BILL AMOUNT
              </span>
              <span className="text-slate-900">
                ₹ {totalBillAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 border-b border-slate-300">
              <span className="text-slate-500 tracking-wider">
                TOTAL CREDITED
              </span>
              <span className="text-slate-900">
                ₹ {totalCreditAmount.toFixed(2)}
              </span>
            </div>
            <div
              className="flex justify-between items-center p-2 font-black text-sm bg-slate-800 text-white"
              style={{
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              <span className="tracking-widest uppercase">CLOSING BALANCE</span>
              <span className="text-base font-black">
                {formatBalance(closingBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
