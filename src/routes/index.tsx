import { createRoute, Link } from "@tanstack/react-router";
import { Route as rootRoute } from "@/routes/__root";
import { 
  ArrowRight, 
  Banknote, 
  Calculator, 
  Users, 
  FileText 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});

function App() {
  return (
    <div className="flex-1 space-y-8 px-4 py-6 sm:p-8 md:p-10 animate-in fade-in duration-500 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2 pb-4 border-b border-zinc-800">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Overview
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          Welcome back! Manage your customers, track balances, and generate reports.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customers Directory */}
        <Link
          to="/customers"
          className="group relative flex flex-col justify-between p-6 bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/60 hover:border-zinc-700 rounded-2xl transition-all overflow-hidden h-40"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-zinc-100 text-lg">Directory</h3>
          </div>
          <div className="flex items-center text-sm font-medium text-blue-400 mt-4 group-hover:translate-x-1 transition-transform">
            View all customers <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </Link>

        {/* Unbilled */}
        <Link
          to="/customers/unbilled"
          className="group relative flex flex-col justify-between p-6 bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/60 hover:border-zinc-700 rounded-2xl transition-all overflow-hidden h-40"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-zinc-100 text-lg">Unbilled</h3>
          </div>
          <div className="flex items-center text-sm font-medium text-rose-400 mt-4 group-hover:translate-x-1 transition-transform">
            Pending records <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </Link>

        {/* Customer Balances */}
        <Link
          to="/customer-balances"
          className="group relative flex flex-col justify-between p-6 bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/60 hover:border-zinc-700 rounded-2xl transition-all overflow-hidden h-40"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Banknote className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-zinc-100 text-lg">Balances</h3>
          </div>
          <div className="flex items-center text-sm font-medium text-emerald-400 mt-4 group-hover:translate-x-1 transition-transform">
            View outstandings <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </Link>

        {/* Customer Rates */}
        <Link
          to="/customer-rates"
          className="group relative flex flex-col justify-between p-6 bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/60 hover:border-zinc-700 rounded-2xl transition-all overflow-hidden h-40"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Calculator className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-zinc-100 text-lg">Rates</h3>
          </div>
          <div className="flex items-center text-sm font-medium text-amber-400 mt-4 group-hover:translate-x-1 transition-transform">
            View rate cards <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </Link>
      </div>

    </div>
  );
}
