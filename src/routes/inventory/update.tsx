import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Info,
  Loader2,
  Package,
  Plus,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { inventoryService } from "@/services/inventoryService";
import { ErrorAlert } from "@/components/ErrorAlert";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inventory/update",
  component: UpdateInventoryPage,
});

// Part metadata helper to get pretty names & colors
const PART_METADATA: Record<
  string,
  { label: string; badgeClass: string; bgClass: string }
> = {
  full: {
    label: "Full Jack",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    bgClass: "from-emerald-500/20 to-emerald-600/5",
  },
  inner: {
    label: "Inner Part",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    bgClass: "from-blue-500/20 to-blue-600/5",
  },
  outer: {
    label: "Outer Part",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    bgClass: "from-purple-500/20 to-purple-600/5",
  },
  plate: {
    label: "Base Plate",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    bgClass: "from-amber-500/20 to-amber-600/5",
  },
};

function getPartMeta(part: string) {
  const normalized = part.toLowerCase();
  return (
    PART_METADATA[normalized] || {
      label: part.toUpperCase(),
      badgeClass: "bg-zinc-800 text-zinc-400 border-zinc-700",
      bgClass: "from-zinc-800/20 to-zinc-900/5",
    }
  );
}

function UpdateInventoryPage() {
  const queryClient = useQueryClient();

  // Form State
  const [part, setPart] = useState("full");
  const [size, setSize] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [isSuccessOverlay, setIsSuccessOverlay] = useState(false);
  const [lastUpdatedItem, setLastUpdatedItem] = useState<{
    part: string;
    size: string;
    amount: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch current stock to allow quick-select and current stock alerts
  const { data: inventory, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => inventoryService.getInventory(),
  });

  // Extract unique sizes for the currently selected part to render quick-select pills
  const existingSizes = useMemo(() => {
    if (!inventory) return [];
    return Array.from(
      new Set(
        inventory
          .filter((item) => item.part.toLowerCase() === part.toLowerCase())
          .map((item) => item.size),
      ),
    ).sort();
  }, [inventory, part]);

  // Find if selected part/size combination already exists in current warehouse inventory
  const currentItem = useMemo(() => {
    if (!inventory || !size) return null;
    return inventory.find(
      (item) =>
        item.part.toLowerCase() === part.toLowerCase() &&
        item.size.trim().toLowerCase() === size.trim().toLowerCase(),
    );
  }, [inventory, part, size]);

  const currentAmount = currentItem ? currentItem.item_amount : 0;
  const targetAmount = amountStr === "" ? 0 : parseInt(amountStr, 10) || 0;
  const delta = targetAmount - currentAmount;

  // Upsert Mutation
  const mutation = useMutation({
    mutationFn: (payload: {
      part: string;
      size: string;
      item_amount: number;
    }) => inventoryService.upsert(payload),
    onSuccess: (data) => {
      setLastUpdatedItem({
        part: data.part,
        size: data.size,
        amount: data.item_amount,
      });
      setIsSuccessOverlay(true);
      setErrorMsg(null);
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!size.trim()) {
      setErrorMsg("Size / Dimension is required.");
      return;
    }
    if (amountStr === "" || Number.isNaN(targetAmount) || targetAmount < 0) {
      setErrorMsg(
        "Please enter a valid stock amount greater than or equal to 0.",
      );
      return;
    }

    setErrorMsg(null);
    mutation.mutate({
      part: part.toLowerCase(),
      size: size.trim(),
      item_amount: targetAmount,
    });
  };

  const handleResetForm = () => {
    setSize("");
    setAmountStr("");
    setIsSuccessOverlay(false);
    setLastUpdatedItem(null);
    setErrorMsg(null);
    mutation.reset();
  };

  if (isSuccessOverlay && lastUpdatedItem) {
    const meta = getPartMeta(lastUpdatedItem.part);
    return (
      <div className="flex-1 max-w-lg mx-auto flex flex-col items-center justify-center p-6 md:p-8 pt-20 animate-in zoom-in duration-300">
        <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-md shadow-2xl relative overflow-hidden w-full text-center">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-emerald-500/80 to-blue-500/50" />

          <CardHeader className="pt-8 pb-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Stock Updated Successfully
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Inventory registry has been committed and synchronized with the
              ledger API.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8">
            {/* Stock Summary Card */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-xs text-zinc-500 font-medium">
                  Part Class
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${meta.badgeClass}`}
                >
                  {meta.label}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-xs text-zinc-500 font-medium">
                  Size Configuration
                </span>
                <span className="font-mono text-xs font-bold text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
                  {lastUpdatedItem.size}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-zinc-500 font-medium">
                  New Warehouse Balance
                </span>
                <span className="font-mono text-sm font-black text-emerald-400">
                  {lastUpdatedItem.amount} units
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 px-8 pb-8 pt-2">
            <Button
              onClick={handleResetForm}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-2.5 rounded-xl cursor-pointer"
            >
              Update Another Item
            </Button>
            <Link to="/inventory" className="w-full">
              <Button
                variant="outline"
                className="w-full border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 py-2.5 rounded-xl cursor-pointer"
              >
                Go to Stock Overview
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8 pt-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-24">
      {/* Back link & Header */}
      <div className="space-y-4">
        <Link
          to="/inventory"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-350 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Stock Overview
        </Link>

        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Plus className="h-8 w-8 text-emerald-500" />
            Update Stock Balance
            <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
              Upsert Mode
            </span>
          </h2>
          <p className="text-zinc-400">
            Create a new inventory category or update the absolute quantity of
            an existing warehouse part.
          </p>
        </div>
      </div>

      {errorMsg && (
        <Alert
          variant="destructive"
          className="bg-rose-500/10 border-rose-500/20 text-rose-400"
        >
          <Info className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {mutation.isError && <ErrorAlert error={mutation.error} />}

      {/* Split Form & Preview Card Layout */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left Column: Form (spans 3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-emerald-500/80 to-blue-500/50" />

            <CardHeader>
              <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-400" />
                Upsert Product Specifications
              </CardTitle>
              <CardDescription className="text-zinc-500 text-xs">
                Select your product parameters. The system will automatically
                detect existing stock lines for safe modification.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Part Type dropdown */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400">
                    Part Category / Type
                  </label>
                  <div className="relative">
                    <select
                      value={part}
                      onChange={(e) => {
                        setPart(e.target.value);
                        setSize(""); // Reset size on changing part type
                      }}
                      className="w-full h-11 rounded-xl border border-zinc-850 bg-zinc-950/60 text-zinc-200 px-4 py-2.5 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500/30 cursor-pointer"
                    >
                      <option value="full">Full Jack (full)</option>
                      <option value="inner">Inner Part (inner)</option>
                      <option value="outer">Outer Part (outer)</option>
                      <option value="plate">Base Plate (plate)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Size input */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-400">
                      Size / Dimension
                    </label>
                    {existingSizes.length > 0 && (
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                        Select Existing Size
                      </span>
                    )}
                  </div>

                  {/* Size Text Input */}
                  <Input
                    placeholder="E.g. 2.0, 2.5, 15x3..."
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="h-11 bg-zinc-950/60 border-zinc-850 text-zinc-200 placeholder:text-zinc-650 focus-visible:ring-emerald-500/30 rounded-xl"
                  />

                  {/* Size Quick Select Pills */}
                  {isLoading ? (
                    <div className="flex gap-2 flex-wrap pt-1">
                      <Skeleton className="h-6 w-12 bg-zinc-950 rounded-full" />
                      <Skeleton className="h-6 w-12 bg-zinc-950 rounded-full" />
                    </div>
                  ) : (
                    existingSizes.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap pt-1 max-h-24 overflow-y-auto pr-2">
                        {existingSizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSize(s)}
                            className={`px-2.5 py-1 text-[11px] font-mono font-bold tracking-tight rounded-full border transition-all cursor-pointer ${
                              size === s
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-md"
                                : "bg-zinc-950 text-zinc-500 border-zinc-850 hover:text-zinc-300 hover:border-zinc-700"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </div>

                {/* 3. Amount input */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400">
                    Warehouse In-House Total Stock
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Enter absolute total amount (e.g., 150)..."
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="h-11 bg-zinc-950/60 border-zinc-850 text-zinc-200 placeholder:text-zinc-650 focus-visible:ring-emerald-500/30 rounded-xl font-mono text-sm"
                  />
                  {currentItem && (
                    <p className="text-[10px] text-zinc-500 flex items-center gap-1.5 pt-1">
                      <Info className="h-3 w-3 text-emerald-500" />
                      Current available stock registry for this product is{" "}
                      <span className="font-mono text-zinc-300 font-bold">
                        {currentItem.item_amount}
                      </span>{" "}
                      units.
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/20"
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Commit Purchase / Update
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live PO Stock Card Preview (spans 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl backdrop-blur-sm relative overflow-hidden flex flex-col min-h-[420px]">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-emerald-500/80 to-blue-500/50" />

            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                Live Stock Card Preview
              </CardTitle>
              <CardDescription className="text-zinc-550 text-xs">
                Real-time ledger projection simulating the committed impact in
                the warehouse.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between pt-2">
              <div className="space-y-5">
                {/* Visual Parts Grid */}
                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-850 flex flex-col gap-3 relative">
                  <div className="absolute top-3 right-3 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>

                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Product Specifications
                  </span>

                  <div className="flex flex-col gap-2.5 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-550">Category</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${getPartMeta(part).badgeClass}`}
                      >
                        {getPartMeta(part).label}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-550">Size/Dimension</span>
                      <span className="font-mono text-xs font-bold text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {size || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delta / Quantities Block */}
                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-850 flex flex-col gap-3.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Quantity Projections
                  </span>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-2.5 rounded bg-zinc-900/40 border border-zinc-850">
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest block">
                        Current
                      </span>
                      <span className="text-sm font-black text-zinc-350 mt-1 block font-mono">
                        {currentAmount}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900/40 border border-zinc-850">
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest block">
                        New Target
                      </span>
                      <span className="text-sm font-black text-zinc-100 mt-1 block font-mono">
                        {targetAmount}
                      </span>
                    </div>
                  </div>

                  {/* Visual Delta Pulse Badge */}
                  {size.trim() !== "" && (
                    <div className="pt-2 border-t border-zinc-900 flex flex-col items-center gap-1">
                      {delta === 0 ? (
                        <div className="px-3 py-1 rounded bg-zinc-800/10 border border-zinc-700/20 text-[10px] font-bold text-zinc-500 uppercase">
                          No Stock Change
                        </div>
                      ) : delta > 0 ? (
                        <>
                          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-black font-mono text-emerald-400 animate-bounce">
                            +{delta} units (ADDITION)
                          </div>
                          <span className="text-[9px] text-zinc-500 text-center leading-relaxed">
                            Increasing inventory footprint of this category by{" "}
                            {delta} parts.
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-black font-mono text-amber-400 animate-bounce">
                            {delta} units (REDUCTION)
                          </div>
                          <span className="text-[9px] text-zinc-500 text-center leading-relaxed">
                            Reducing warehouse balance by {Math.abs(delta)}{" "}
                            parts.
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Barcode representation */}
              <div className="pt-8 flex flex-col items-center gap-2 opacity-30 mt-auto">
                <div className="flex gap-[2px] h-9 items-center justify-center">
                  {[
                    3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4,
                    6,
                  ].map((w, idx) => (
                    <div
                      key={idx}
                      className="bg-white h-full"
                      style={{ width: `${(w % 3) + 1}px` }}
                    />
                  ))}
                </div>
                <span className="text-[8px] tracking-widest font-mono text-zinc-500 uppercase">
                  STOCK-CARD-PO-{part.substring(0, 3)}-{size || "NEW"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
