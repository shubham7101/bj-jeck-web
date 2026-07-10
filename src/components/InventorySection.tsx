import { AlertCircle, Layers, PackageOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface InventoryItem {
  item_amount: number;
  part: string;
  size: string;
}

export interface RateItem {
  part: string;
  size: string;
  rate: number;
}

export interface SiteInventorySectionProps {
  inventory?: InventoryItem[];
  rates?: RateItem[];
  isLoading?: boolean;
  isError?: boolean;
}

export function SiteInventorySection({
  inventory = [],
  rates = [],
  isLoading = false,
  isError = false,
}: SiteInventorySectionProps) {
  const [combineParts, setCombineParts] = useState(true);

  const sortedInventory = useMemo(() => {
    return [...inventory].sort((a, b) => {
      if (a.part !== b.part) return a.part.localeCompare(b.part);
      return a.size.localeCompare(b.size);
    });
  }, [inventory]);

  const getRate = (part: string, size: string) => {
    const rateItem = rates.find(
      (r) =>
        r.part.toLowerCase() === part.toLowerCase() &&
        r.size.toLowerCase() === size.toLowerCase(),
    );
    return rateItem ? rateItem.rate : null;
  };

  const displayInventory = useMemo(() => {
    if (!combineParts || !sortedInventory.length) return sortedInventory;

    const itemsBySize = new Map<string, typeof sortedInventory>();
    sortedInventory.forEach((item) => {
      if (!itemsBySize.has(item.size)) {
        itemsBySize.set(item.size, []);
      }
      itemsBySize.get(item.size)!.push({ ...item });
    });

    const combined: typeof sortedInventory = [];

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
  }, [sortedInventory, combineParts]);

  return (
    <Card className="lg:col-span-2 bg-zinc-900/40 border-zinc-800 shadow-xl backdrop-blur-sm overflow-hidden self-start w-full">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-800/50">
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
                        This site has no active inventory.
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
                        item.item_amount < 0 ? "text-rose-500" : "text-zinc-100"
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
  );
}
