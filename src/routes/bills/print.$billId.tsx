import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Printer } from "lucide-react";
import { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { billService } from "@/services/billService";
import { customerService } from "@/services/customerService";

export const Route = createFileRoute("/bills/print/$billId")({
  loader: async ({ params }) => {
    const bill = await billService.get(Number(params.billId));
    const customer = await customerService.get(bill.customer_id);
    return { bill, customer };
  },
  component: PrintBillPage,
});

function PrintBillPage() {
  const { bill: billData, customer } = Route.useLoaderData() as any;
  const navigate = Route.useNavigate();

  useEffect(() => {
    if (billData && customer) {
      document.title = `${billData.id}-${customer.name}-${customer.id}`;
      const timer = setTimeout(() => {
        window.print();
        if (window.history.length > 1) {
          window.history.back();
        } else {
          navigate({
            to: "/bills/$billId",
            params: { billId: billData.id.toString() },
            replace: true,
          });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [billData, customer, navigate]);

  const allRecordCharges = Array.from(
    new Set([
      ...Object.keys(billData.labour_charges || {}),
      ...Object.keys(billData.transport_charges || {}),
      ...Object.keys(billData.lost_charges || {}),
    ]),
  );

  const charges = allRecordCharges
    .map((recordCharge) => {
      const labour = (billData.labour_charges as any)[recordCharge] || 0;
      const transport = (billData.transport_charges as any)[recordCharge] || 0;
      const lost = (billData.lost_charges as any)[recordCharge] || 0;
      return {
        recordCharge,
        labour,
        transport,
        lost,
        rowTotal: labour + transport + lost,
      };
    })
    .filter((c) => c.rowTotal > 0);

  const chargesTotal = charges.reduce((acc, c) => acc + c.rowTotal, 0);
  const grandTotal = billData.total.toFixed(2);
  const rentalAmount = (billData.total - chargesTotal).toFixed(2);

  const generatedOn = format(new Date(), "dd-MM-yyyy HH:mm:ss");
  const periodStr = `${format(new Date(billData.from_date), "dd-MM-yyyy")} TO ${format(new Date(billData.to_date), "dd-MM-yyyy")}`;

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
      {/* Screen-only Print Button */}
      <div className="max-w-[1000px] mx-auto mb-4 flex justify-end print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded shadow-md hover:bg-slate-700 transition-colors text-sm font-semibold tracking-wide"
        >
          <Printer className="h-4 w-4" /> Print Bill
        </button>
      </div>

      <div className="max-w-[1000px] mx-auto border-2 border-slate-800 bg-white shadow-2xl print:shadow-none flex flex-col print:min-h-[277mm]">
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
              <span className="text-slate-500 tracking-wider">BILL NO</span>
              <span className="text-slate-900">{billData.id}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-300 pb-0.5">
              <span className="text-slate-500 tracking-wider">KHATA NO</span>
              <span className="text-slate-900">{billData.khata_no}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-300 pb-0.5">
              <span className="text-slate-500 tracking-wider">
                BILLING PERIOD
              </span>
              <span className="text-slate-900">{periodStr}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 tracking-wider">
                GENERATED ON
              </span>
              <span className="text-slate-900">{generatedOn}</span>
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="flex flex-col">
          {Object.entries(billData.items_by_size_and_part || {}).map(
            ([key, table]: [string, any], idx: number) => {
              const [part, size] = key.split("_");
              const totalAmount = (
                (table?.initial_line?.total || 0) +
                (table?.lines || []).reduce(
                  (acc: number, line: any) => acc + line.total,
                  0,
                )
              ).toFixed(2);

              let hasMultipleEntries = false;
              if (
                Object.values(table?.initial_line?.item_details || {}).filter(
                  (v) => v !== 0,
                ).length > 1
              ) {
                hasMultipleEntries = true;
              } else {
                for (const line of table?.lines || []) {
                  if (
                    Object.values(line.total_item_amount || {}).filter(
                      (v) => v !== 0,
                    ).length > 1
                  ) {
                    hasMultipleEntries = true;
                    break;
                  }
                }
              }

              return (
                <div
                  key={idx}
                  className="border-b-2 border-slate-800 last:border-b-0 break-inside-avoid"
                >
                  <div className="flex justify-between items-center bg-slate-200 border-b-2 border-slate-800 font-extrabold text-xs px-4 py-1 uppercase tracking-widest text-slate-900">
                    <span className="flex items-center gap-3">
                      <span className="bg-slate-800 text-white px-2 py-0.5 rounded-sm shadow-sm">
                        {part.toUpperCase()}
                      </span>
                      <span className="text-slate-800">{size}</span>
                    </span>
                    <div className="flex items-center gap-4 text-[10px] font-bold tracking-wider uppercase">
                      {part.toLowerCase() === "full" && (
                        <span>F : FULL | I : INNER | O : OUTER</span>
                      )}
                      {part.toLowerCase() === "plate" && <span>P : PLATE</span>}
                    </div>
                    <span>LEDGER</span>
                  </div>
                  <Table className="w-full text-[10px] text-center border-collapse">
                    <TableHeader className="bg-white">
                      <TableRow className="border-b-2 border-slate-800 hover:bg-white">
                        <TableHead className="border-r border-slate-400 py-1 px-1 h-auto text-center font-bold text-slate-800 uppercase tracking-wider">
                          RECORD NO.
                        </TableHead>
                        <TableHead className="border-r border-slate-400 py-1 px-1 h-auto text-center font-bold text-slate-800 uppercase tracking-wider">
                          DATE
                        </TableHead>
                        <TableHead className="border-r border-slate-400 py-1 px-1 h-auto text-center font-bold text-slate-800 uppercase tracking-wider">
                          ACTION
                        </TableHead>
                        <TableHead className="border-r border-slate-400 py-1 px-1 h-auto text-center font-bold text-slate-800 uppercase tracking-wider">
                          QTY
                        </TableHead>
                        <TableHead className="border-r border-slate-400 py-1 px-1 h-auto text-center font-bold text-slate-800 uppercase tracking-wider">
                          BALANCE
                        </TableHead>
                        <TableHead className="border-r border-slate-400 py-1 px-1 h-auto text-center font-bold text-slate-800 uppercase tracking-wider">
                          DAYS
                        </TableHead>
                        <TableHead className="border-r border-slate-400 py-1 px-1 h-auto text-center font-bold text-slate-800 uppercase tracking-wider">
                          RATE
                        </TableHead>
                        <TableHead className="border-r border-slate-400 py-1 px-1 h-auto text-center font-bold text-slate-800 uppercase tracking-wider">
                          SERVICE
                        </TableHead>
                        <TableHead className="border-r border-slate-400 py-1 px-1 h-auto text-center font-bold text-slate-800 uppercase tracking-wider">
                          DAMAGE
                        </TableHead>
                        <TableHead className="py-1 px-3 h-auto text-right font-extrabold text-slate-900 uppercase tracking-wider bg-slate-50">
                          AMOUNT
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Opening Line */}
                      <TableRow className="border-b border-slate-300 hover:bg-slate-50/50 transition-colors last:border-b-0">
                        <TableCell className="border-r border-slate-300 py-0.5 px-1 font-semibold">
                          -
                        </TableCell>
                        <TableCell className="border-r border-slate-300 py-0.5 px-1 font-semibold">
                          {format(
                            new Date(table.initial_line.date),
                            "dd-MM-yyyy",
                          )}
                        </TableCell>
                        <TableCell className="border-r border-slate-300 py-0.5 px-1 font-bold">
                          OPENING
                        </TableCell>
                        <TableCell className="border-r border-slate-300 py-0.5 px-1 pl-6 text-left font-semibold text-slate-700">
                          -
                        </TableCell>
                        <TableCell
                          className={`border-r border-slate-300 py-0.5 px-2 font-bold text-slate-800 ${hasMultipleEntries ? "pl-6 text-left" : ""}`}
                        >
                          <div
                            className={
                              hasMultipleEntries
                                ? "grid grid-cols-2"
                                : "text-left pl-6"
                            }
                          >
                            {Object.entries(table.initial_line.item_details)
                              .filter(([_, val]) => val !== 0)
                              .map(([k, v]) => (
                                <span
                                  key={k}
                                  className={
                                    (v as number) < 0
                                      ? "text-red-600"
                                      : "text-slate-800"
                                  }
                                >
                                  {k[0].toUpperCase()} : {v as number}
                                </span>
                              ))}
                          </div>
                        </TableCell>
                        <TableCell className="border-r border-slate-300 py-0.5 px-1 font-medium">
                          {table.initial_line.days}
                        </TableCell>
                        <TableCell className="border-r border-slate-300 py-0.5 px-1 font-medium">
                          {table.initial_line.rate.toFixed(2)}
                        </TableCell>
                        <TableCell className="border-r border-slate-300 py-0.5 px-1">
                          -
                        </TableCell>
                        <TableCell className="border-r border-slate-300 py-0.5 px-1">
                          -
                        </TableCell>
                        <TableCell className="py-0.5 px-3 text-right font-bold text-slate-900 bg-slate-50/50">
                          {table.initial_line.total.toFixed(2)}
                        </TableCell>
                      </TableRow>

                      {/* Lines */}
                      {(table?.lines || []).map((line: any, i: number) => (
                        <TableRow
                          key={i}
                          className="border-b border-slate-300 hover:bg-slate-50/50 transition-colors last:border-b-0"
                        >
                          <TableCell className="border-r border-slate-300 py-0.5 px-1 font-semibold">
                            {`#${line.record_id}`}
                          </TableCell>
                          <TableCell className="border-r border-slate-300 py-0.5 px-1 font-semibold">
                            {format(new Date(line.date), "dd-MM-yyyy")}
                          </TableCell>
                          <TableCell
                            className={`border-r border-slate-300 py-0.5 px-1 font-bold ${line.transaction_type === "IN" ? "text-green-600" : "text-blue-600"}`}
                          >
                            {line.transaction_type}
                          </TableCell>
                          <TableCell
                            className={`border-r border-slate-300 py-0.5 px-1 pl-6 text-left font-semibold`}
                          >
                            {line.item_part
                              ? line.item_part[0].toUpperCase()
                              : ""}{" "}
                            : {line.item_amount}
                          </TableCell>
                          <TableCell
                            className={`border-r border-slate-300 py-0.5 px-1 font-bold text-slate-800 ${hasMultipleEntries ? "pl-6 text-left" : ""}`}
                          >
                            <div
                              className={
                                hasMultipleEntries
                                  ? "grid grid-cols-2"
                                  : "text-left pl-6"
                              }
                            >
                              {Object.entries(line.total_item_amount)
                                .filter(([_, val]) => val !== 0)
                                .map(([k, v]) => (
                                  <span
                                    key={k}
                                    className={
                                      (v as number) < 0
                                        ? "text-red-600"
                                        : "text-slate-800"
                                    }
                                  >
                                    {k[0].toUpperCase()} : {v as number}
                                  </span>
                                ))}
                            </div>
                          </TableCell>
                          <TableCell className="border-r border-slate-300 py-0.5 px-1 font-medium">
                            {line.days}
                          </TableCell>
                          <TableCell className="border-r border-slate-300 py-0.5 px-1 font-medium">
                            {line.rate.toFixed(2)}
                          </TableCell>
                          <TableCell
                            className={`border-r border-slate-300 py-0.5 px-1 ${line.service_charge !== 0 ? "font-semibold text-orange-500" : ""}`}
                          >
                            {line.service_charge !== 0
                              ? line.service_charge
                              : "-"}
                          </TableCell>
                          <TableCell
                            className={`border-r border-slate-300 py-0.5 px-1 ${line.broken_charge !== 0 ? "font-semibold text-rose-500" : ""}`}
                          >
                            {line.broken_charge !== 0
                              ? line.broken_charge
                              : "-"}
                          </TableCell>
                          <TableCell className="py-0.5 px-3 text-right font-bold text-slate-900 bg-slate-50/50">
                            {line.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter className="bg-slate-50 border-t-2 border-slate-800">
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={9}
                          className="border-r-2 border-slate-800 py-0.5 px-4 text-right font-bold text-slate-700 uppercase tracking-widest text-xs"
                        >
                          TOTAL AMOUNT FOR{" "}
                          <span className="font-extrabold text-slate-900 mx-1">
                            {part.toUpperCase()} {size}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-900 py-0.5 px-3 font-bold">
                          {totalAmount}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              );
            },
          )}
        </div>

        {/* Dynamic Space Filler to push footer to bottom */}
        <div className="grow border-t-2 border-slate-800 bg-slate-50/10"></div>

        {/* Footer Section */}
        <div className="flex border-t-2 border-slate-800 break-inside-avoid">
          {/* Left: Closing Stock & Terms */}
          <div className="w-[55%] border-r-2 border-slate-800 flex flex-col bg-slate-50/30">
            <div className="p-1.5 flex-1 flex flex-col">
              <div className="font-extrabold text-[10px] uppercase mb-1 tracking-widest text-slate-800 text-center">
                Closing Stock Summary
              </div>
              <div className="flex-1 w-full flex justify-center">
                <Table className="w-[95%] text-[10px] text-left border-collapse border border-slate-400 bg-white shadow-sm">
                  <TableHeader className="bg-slate-100">
                    <TableRow className="border-b border-slate-400 hover:bg-slate-100">
                      <TableHead className="border-r border-slate-400 py-0.5 px-2 h-auto font-bold text-slate-800 uppercase tracking-wider">
                        PART
                      </TableHead>
                      <TableHead className="border-r border-slate-400 py-0.5 px-2 h-auto font-bold text-slate-800 uppercase tracking-wider">
                        SIZE
                      </TableHead>
                      <TableHead className="py-0.5 px-2 h-auto text-right font-extrabold text-slate-900 uppercase tracking-wider">
                        COUNT
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(billData.after_inventory || []).map(
                      (inv: any, i: number) => (
                        <TableRow
                          key={i}
                          className="border-b border-slate-300 hover:bg-transparent last:border-b-0"
                        >
                          <TableCell className="border-r border-slate-300 py-0.5 px-2 uppercase font-bold text-slate-700">
                            {inv.part.toUpperCase()}
                          </TableCell>
                          <TableCell className="border-r border-slate-300 py-0.5 px-2 font-semibold text-slate-600">
                            {inv.size}
                          </TableCell>
                          <TableCell className="py-0.5 px-2 font-bold text-right">
                            <span
                              className={
                                (inv.item_amount as number) < 0
                                  ? "text-red-600"
                                  : "text-slate-900"
                              }
                            >
                              {inv.item_amount}
                            </span>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Right: Totals & Signatures */}
          <div className="w-[45%] flex flex-col bg-white">
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center p-1.5 font-bold text-sm bg-slate-50/80 border-b border-slate-300">
                <span className="text-slate-600 tracking-wider">
                  RENTAL AMOUNT
                </span>
                <span className="text-base text-slate-900">
                  ₹ {rentalAmount}
                </span>
              </div>
              <div className="p-1.5 flex flex-col">
                {charges.length > 0 && (
                  <>
                    <span className="font-semibold uppercase mb-1 text-slate-500 tracking-wide text-center text-xs">
                      Additional Charges Breakdown
                    </span>
                    <div className="w-full flex justify-center">
                      <Table className="w-full text-[10px] text-center border-collapse border border-slate-300">
                        <TableHeader className="bg-slate-50">
                          <TableRow className="border-b border-slate-300 hover:bg-slate-50">
                            <TableHead className="border-r border-slate-300 py-0.5 px-2 h-auto text-left font-bold text-slate-600 uppercase tracking-wider">
                              RECORD NO.
                            </TableHead>
                            <TableHead className="border-r border-slate-300 py-0.5 px-2 h-auto text-right font-bold text-slate-600 uppercase tracking-wider">
                              LABOUR
                            </TableHead>
                            <TableHead className="border-r border-slate-300 py-0.5 px-2 h-auto text-right font-bold text-slate-600 uppercase tracking-wider">
                              TRANS.
                            </TableHead>
                            <TableHead className="border-r border-slate-300 py-0.5 px-2 h-auto text-right font-bold text-slate-600 uppercase tracking-wider">
                              LOST
                            </TableHead>
                            <TableHead className="py-0.5 px-2 h-auto text-right font-bold text-slate-800 uppercase tracking-wider">
                              TOTAL
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {charges.map((charge, i) => (
                            <TableRow
                              key={i}
                              className="border-b border-slate-100 hover:bg-slate-50/50 last:border-b-0"
                            >
                              <TableCell className="border-r border-slate-100 py-0.5 px-2 text-left font-bold text-slate-700">
                                {`#${charge.recordCharge}`}
                              </TableCell>
                              <TableCell className="border-r border-slate-100 py-0.5 px-2 text-right font-semibold text-slate-600">
                                {charge.labour.toFixed(2)}
                              </TableCell>
                              <TableCell className="border-r border-slate-100 py-0.5 px-2 text-right font-semibold text-slate-600">
                                {charge.transport.toFixed(2)}
                              </TableCell>
                              <TableCell className="border-r border-slate-100 py-0.5 px-2 text-right font-semibold text-slate-600">
                                {charge.lost.toFixed(2)}
                              </TableCell>
                              <TableCell className="py-0.5 px-2 text-right font-bold text-slate-900">
                                {charge.rowTotal.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-between items-center font-bold text-[10px] mt-1 px-1">
                      <span className="text-slate-600 tracking-wider">
                        TOTAL CHARGES
                      </span>
                      <span className="text-slate-900">
                        ₹ {chargesTotal.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div
              className="flex justify-between items-center p-1.5 font-black text-lg bg-slate-800 text-white border-t-2 border-slate-800"
              style={{
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              <span className="tracking-widest uppercase">GRAND TOTAL</span>
              <span className="text-xl">₹ {grandTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
