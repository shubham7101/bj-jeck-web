import { useQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Layers,
  Loader2,
  Package,
  RefreshCw,
  Scale,
  Search,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inventoryService } from "@/services/inventoryService";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inventory/",
  component: InventoryOverviewPage,
});

// Part metadata helper to get pretty names & colors
const PART_METADATA: Record<
  string,
  { label: string; badgeClass: string; textClass: string; bgClass: string }
> = {
  full: {
    label: "Full Jack",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    textClass: "text-emerald-400",
    bgClass: "from-emerald-500/20 to-emerald-600/5",
  },
  inner: {
    label: "Inner Part",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    textClass: "text-blue-400",
    bgClass: "from-blue-500/20 to-blue-600/5",
  },
  outer: {
    label: "Outer Part",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    textClass: "text-purple-400",
    bgClass: "from-purple-500/20 to-purple-600/5",
  },
  plate: {
    label: "Base Plate",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    textClass: "text-amber-400",
    bgClass: "from-amber-500/20 to-amber-600/5",
  },
};

function getPartMeta(part: string) {
  const normalized = part.toLowerCase();
  return (
    PART_METADATA[normalized] || {
      label: part.toUpperCase(),
      badgeClass: "bg-zinc-800 text-zinc-400 border-zinc-700",
      textClass: "text-zinc-400",
      bgClass: "from-zinc-800/20 to-zinc-900/5",
    }
  );
}

function InventoryOverviewPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPart, setSelectedPart] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const {
    data: inventory,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => inventoryService.getInventory(),
  });

  // Calculate high-density aggregations
  const stats = useMemo(() => {
    if (!inventory)
      return { inHouse: 0, outstanding: 0, net: 0, uniqueCount: 0 };
    let inHouse = 0;
    let outstanding = 0;
    let net = 0;

    inventory.forEach((item) => {
      const amount = item.item_amount;
      if (amount > 0) {
        inHouse += amount;
      } else if (amount < 0) {
        outstanding += Math.abs(amount);
      }
      net += amount;
    });

    return {
      inHouse,
      outstanding,
      net,
      uniqueCount: inventory.length,
    };
  }, [inventory]);

  // Filtered Inventory items
  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter((item) => {
      // 1. Search term match (part name or size)
      const matchesSearch =
        item.part.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.size.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Part filter match
      const matchesPart =
        selectedPart === "all" || item.part.toLowerCase() === selectedPart;

      // 3. Status filter match
      let matchesStatus = true;
      if (selectedStatus === "available") {
        matchesStatus = item.item_amount > 0;
      } else if (selectedStatus === "dispatched") {
        matchesStatus = item.item_amount < 0;
      } else if (selectedStatus === "zero") {
        matchesStatus = item.item_amount === 0;
      }

      return matchesSearch && matchesPart && matchesStatus;
    });
  }, [inventory, searchTerm, selectedPart, selectedStatus]);

  // Calculate potential assemblies (Inner + Outer = Full Jack of same size)
  const assemblies = useMemo(() => {
    if (!inventory) return [];

    // Get all unique sizes in the inventory
    const sizes = Array.from(new Set(inventory.map((item) => item.size)));

    return sizes
      .map((size) => {
        const innerItem = inventory.find(
          (i) => i.part.toLowerCase() === "inner" && i.size === size,
        );
        const outerItem = inventory.find(
          (i) => i.part.toLowerCase() === "outer" && i.size === size,
        );

        const innerStock =
          innerItem && innerItem.item_amount > 0 ? innerItem.item_amount : 0;
        const outerStock =
          outerItem && outerItem.item_amount > 0 ? outerItem.item_amount : 0;

        const possible = Math.min(innerStock, outerStock);

        return {
          size,
          innerStock,
          outerStock,
          possible,
          missingType: innerStock > outerStock ? "outer" : "inner",
          missingQty: Math.abs(innerStock - outerStock),
        };
      })
      .filter((item) => item.innerStock > 0 || item.outerStock > 0)
      .sort((a, b) => b.possible - a.possible || a.size.localeCompare(b.size));
  }, [inventory]);

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <div className="flex-1 space-y-8 px-2 py-6 sm:p-6 md:p-8 pt-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-24 overflow-x-hidden">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Package className="h-8 w-8 text-emerald-500" />
            Inventory Overview
            <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
              Live System Stock
            </span>
          </h2>
          <p className="text-zinc-400">
            Real-time stock ledger representing dispatched inventory and
            in-house storage limits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefetching}
            className="border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer h-9 px-3"
          >
            {isRefetching ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Stock
          </Button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className="h-28 w-full bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          <StatsCard
            title="In-House Stock"
            value={stats.inHouse}
            subText="Available inside warehouse"
            icon={<ArrowDownLeft className="h-4 w-4 text-emerald-400" />}
            valueColor="text-emerald-400"
          />
          <StatsCard
            title="Dispatched / Rented"
            value={stats.outstanding}
            subText="Outstanding with customers"
            icon={<ArrowUpRight className="h-4 w-4 text-amber-400" />}
            valueColor="text-amber-400"
          />
          <StatsCard
            title="Net Ledger Balance"
            value={stats.net}
            subText="Outstanding stock net liability"
            icon={<Scale className="h-4 w-4 text-zinc-400" />}
            valueColor={stats.net < 0 ? "text-rose-400" : "text-zinc-200"}
          />
          <StatsCard
            title="Active Catalog Items"
            value={stats.uniqueCount}
            subText="Unique part-size categories"
            icon={<Layers className="h-4 w-4 text-blue-400" />}
            valueColor="text-blue-400"
          />
        </div>
      )}

      {/* 2-Column Split Layout for Registry & Assembly Planner */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Stock Registry */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-emerald-500/80 to-blue-500/50" />

            <CardHeader className="pb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    Live Stock Registry
                  </CardTitle>
                  <CardDescription className="text-zinc-550">
                    Detailed inventory metrics filtered by part category and
                    dispatched status.
                  </CardDescription>
                </div>

                {/* Quick Summary Badges */}
                {!isLoading && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/5 text-emerald-400 border-emerald-500/20 text-[10px]"
                    >
                      In Stock:{" "}
                      {
                        filteredInventory.filter((i) => i.item_amount > 0)
                          .length
                      }{" "}
                      categories
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-rose-500/5 text-rose-400 border-rose-500/20 text-[10px]"
                    >
                      Dispatched:{" "}
                      {
                        filteredInventory.filter((i) => i.item_amount < 0)
                          .length
                      }{" "}
                      categories
                    </Badge>
                  </div>
                )}
              </div>

              {/* Filtering controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Search size (e.g. 2.0, 15x3)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-zinc-950/60 border-zinc-800 text-zinc-200 placeholder:text-zinc-650 focus-visible:ring-emerald-500/30"
                  />
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={selectedPart}
                    onChange={(e) => setSelectedPart(e.target.value)}
                    className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-950/60 text-zinc-300 px-3 py-1 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500/30 cursor-pointer"
                  >
                    <option value="all">All Part Types</option>
                    <option value="full">Full Jacks</option>
                    <option value="inner">Inners</option>
                    <option value="outer">Outers</option>
                    <option value="plate">Base Plates</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-950/60 text-zinc-300 px-3 py-1 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500/30 cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="available">
                      In-House Available (&gt; 0)
                    </option>
                    <option value="dispatched">
                      Rented / Outstanding (&lt; 0)
                    </option>
                    <option value="zero">Out of Stock (= 0)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[600px]">
                <TableHeader className="bg-zinc-950/40 border-b border-zinc-800/80 sticky top-0 z-10">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="w-1/4 pl-6 h-12 text-zinc-400 uppercase text-[10px] font-black tracking-wider">
                      Part Category
                    </TableHead>
                    <TableHead className="w-1/4 h-12 text-zinc-400 uppercase text-[10px] font-black tracking-wider">
                      Size / Dimension
                    </TableHead>
                    <TableHead className="w-1/4 h-12 text-zinc-400 uppercase text-[10px] font-black tracking-wider">
                      Stock Status
                    </TableHead>
                    <TableHead className="w-1/4 text-right pr-6 h-12 text-zinc-400 uppercase text-[10px] font-black tracking-wider">
                      Current Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <TableRow key={i} className="border-zinc-850">
                        <TableCell className="pl-6 h-14">
                          <Skeleton className="h-5 w-24 bg-zinc-800/60" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16 bg-zinc-800/60 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-32 bg-zinc-800/60 rounded-md" />
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Skeleton className="h-5 w-12 bg-zinc-800/60 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-44 text-center">
                        <div className="flex flex-col items-center justify-center text-rose-500 gap-3">
                          <AlertCircle className="h-8 w-8" />
                          <div className="space-y-1">
                            <span className="text-sm font-semibold block">
                              Failed to Fetch Inventory
                            </span>
                            <span className="text-xs text-zinc-550 block">
                              Please check backend API connection status.
                            </span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-44 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 text-zinc-550">
                          <Package className="h-8 w-8 text-zinc-700" />
                          <div className="space-y-1">
                            <span className="text-sm font-semibold text-zinc-400 block">
                              No Inventory Items Found
                            </span>
                            <span className="text-xs text-zinc-650 block">
                              No matching sizes or part categories match
                              filters.
                            </span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map((item, idx) => {
                      const meta = getPartMeta(item.part);
                      const amount = item.item_amount;

                      // Status helper logic
                      let statusLabel = "Out of Stock";
                      let statusColor =
                        "bg-zinc-800 text-zinc-400 border-zinc-700";
                      let dotColor = "bg-zinc-500";

                      if (amount > 0) {
                        statusLabel = "Available (In-House)";
                        statusColor =
                          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                        dotColor = "bg-emerald-500 animate-pulse";
                      } else if (amount < 0) {
                        statusLabel = "Dispatched (Rented)";
                        statusColor =
                          "bg-amber-500/10 text-amber-400 border-amber-500/20";
                        dotColor = "bg-amber-500 animate-pulse";
                      }

                      return (
                        <TableRow
                          key={`${item.part}-${item.size}-${idx}`}
                          className="border-zinc-800/80 hover:bg-zinc-950/20 transition-all"
                        >
                          {/* Part Category */}
                          <TableCell className="pl-6 h-14 font-medium text-zinc-200">
                            <Badge
                              variant="outline"
                              className={`${meta.badgeClass} font-semibold px-2 py-0.5 rounded text-[10px]`}
                            >
                              {meta.label}
                            </Badge>
                          </TableCell>

                          {/* Size / Dimension */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-zinc-950 text-zinc-300 border-zinc-800 text-xs font-mono font-bold tracking-tight"
                            >
                              {item.size}
                            </Badge>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${statusColor} flex items-center w-fit gap-1.5 px-2 py-0.5 text-[10px]`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${dotColor}`}
                              />
                              {statusLabel}
                            </Badge>
                          </TableCell>

                          {/* Amount */}
                          <TableCell className="text-right pr-6">
                            <span
                              className={`font-mono text-sm font-bold tabular-nums tracking-tight ${
                                amount > 0
                                  ? "text-emerald-400"
                                  : amount < 0
                                    ? "text-rose-400"
                                    : "text-zinc-550"
                              }`}
                            >
                              {amount > 0 ? `+${amount}` : amount}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Intelligent Assembly Suggester */}
        <div className="space-y-6 min-w-0">
          <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl backdrop-blur-sm relative overflow-hidden flex flex-col h-full min-h-[300px]">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-emerald-500/80 to-blue-500/50" />

            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                Intelligent Assembly Suggestion
              </CardTitle>
              <CardDescription className="text-zinc-550 text-xs leading-relaxed">
                Matches current In-House Inners & Outers of the same size to
                estimate how many Full Jacks you can build right now.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-4 pt-2">
              {isLoading ? (
                [1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-24 w-full bg-zinc-950/60 rounded-xl"
                  />
                ))
              ) : isError ? (
                <div className="text-center py-6 text-zinc-500 italic text-xs">
                  Error loading assembly combinations.
                </div>
              ) : assemblies.length === 0 ? (
                <div className="text-center py-8 text-zinc-550 italic text-xs flex flex-col items-center justify-center gap-2 bg-zinc-950/20 rounded-xl p-6 border border-zinc-800 border-dashed">
                  <Package className="h-6 w-6 text-zinc-700 animate-bounce" />
                  <span>
                    No matching Inners & Outers in stock to assemble Full Jacks.
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {assemblies.map((combo) => {
                    const pct =
                      combo.possible > 0
                        ? (combo.possible /
                            Math.max(combo.innerStock, combo.outerStock)) *
                          100
                        : 0;
                    return (
                      <div
                        key={combo.size}
                        className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-750 transition-all flex flex-col gap-3"
                      >
                        {/* Title Bar */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-350">
                            Size:{" "}
                            <span className="font-mono text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800/80 text-xs">
                              {combo.size}
                            </span>
                          </span>
                          {combo.possible > 0 ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold"
                            >
                              {combo.possible} Assemblies Ready
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-zinc-800 text-zinc-500 border-zinc-700 text-[10px]"
                            >
                              Uneven Stock
                            </Badge>
                          )}
                        </div>

                        {/* Inventory Details Grid */}
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="p-2 rounded bg-zinc-950/60 border border-zinc-900">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                              Inner Stock
                            </span>
                            <span className="text-sm font-black text-zinc-200 mt-1 block font-mono">
                              {combo.innerStock}
                            </span>
                          </div>
                          <div className="p-2 rounded bg-zinc-950/60 border border-zinc-900">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                              Outer Stock
                            </span>
                            <span className="text-sm font-black text-zinc-200 mt-1 block font-mono">
                              {combo.outerStock}
                            </span>
                          </div>
                        </div>

                        {/* Progress or suggestion */}
                        {combo.possible > 0 ? (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-[10px] text-zinc-400">
                              <span>Part Assembly Ratio</span>
                              <span className="font-mono">
                                {combo.possible} /{" "}
                                {Math.max(combo.innerStock, combo.outerStock)} (
                                {pct.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            {combo.missingQty > 0 && (
                              <p className="text-[9px] text-zinc-500 mt-1 italic">
                                Tip: Add {combo.missingQty} more{" "}
                                {combo.missingType === "inner"
                                  ? "Inner"
                                  : "Outer"}{" "}
                                parts to assemble{" "}
                                {Math.max(combo.innerStock, combo.outerStock)}{" "}
                                Full Jacks.
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[9px] text-rose-450 bg-rose-500/5 p-2 rounded border border-rose-500/10 italic">
                            Cannot assemble Full Jacks: missing{" "}
                            {combo.missingType === "inner" ? "Inner" : "Outer"}{" "}
                            parts. Need {combo.missingQty} to build{" "}
                            {combo.missingQty} assemblies.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
