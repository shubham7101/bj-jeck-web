import { createRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Activity,
  ArrowRight,
  Banknote,
  BookOpen,
  Calculator,
  Clock,
  FileText,
  MapPin,
  Package,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Route as rootRoute } from "@/routes/__root";
import type { Record } from "@/schemas/recordSchema";
import { billService } from "@/services/billService";
import { customerService } from "@/services/customerService";
import { recordService } from "@/services/recordService";
import { siteService } from "@/services/siteService";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  loader: async () => {
    try {
      const [customers, sites, bills, records] = await Promise.all([
        customerService.search({ per_page: 1 }),
        siteService.search({ per_page: 1 }),
        billService.search({ per_page: 1 }),
        recordService.search({ per_page: 5 }),
      ]);

      return {
        stats: {
          totalCustomers: customers.pagination.total_count,
          totalSites: sites.pagination.total_count,
          totalBills: bills.pagination.total_count,
          totalRecords: records.pagination.total_count,
        },
        recentRecords: records.data,
      };
    } catch (e) {
      console.error("Dashboard loader error:", e);
      return {
        stats: {
          totalCustomers: 0,
          totalSites: 0,
          totalBills: 0,
          totalRecords: 0,
        },
        recentRecords: [] as Record[],
      };
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { stats, recentRecords } = Route.useLoaderData();

  return (
    <div className="flex-1 w-full max-w-[100vw] lg:max-w-6xl lg:mx-auto px-2 py-4 sm:py-6 sm:p-6 md:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24 overflow-x-hidden min-w-0">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-zinc-900/50 border border-zinc-800/50 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-400">
            Welcome to BG Jeck
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl font-medium">
            Overview of your enterprise operations. Manage customers, track
            ongoing sites, monitor unbilled records, and handle inventory
            efficiently.
          </p>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          trend="+ Active base"
          color="blue"
        />
        <StatCard
          title="Active Sites"
          value={stats.totalSites}
          icon={MapPin}
          trend="+ Project sites"
          color="emerald"
        />
        <StatCard
          title="Total Records"
          value={stats.totalRecords}
          icon={FileText}
          trend="+ Entries"
          color="amber"
        />
        <StatCard
          title="Generated Bills"
          value={stats.totalBills}
          icon={Receipt}
          trend="+ Invoices"
          color="rose"
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-400" /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            to="/customers"
            title="Directory"
            description="View all customers"
            icon={Users}
            color="blue"
          />
          <QuickActionCard
            to="/sites/unbilled"
            title="Unbilled Sites"
            description="Pending records to bill"
            icon={FileText}
            color="rose"
          />
          <QuickActionCard
            to="/customer-balances"
            title="Customer Balances"
            description="View outstandings"
            icon={Banknote}
            color="emerald"
          />
          <QuickActionCard
            to="/customer-rates"
            title="Customer Rates"
            description="View rate cards"
            icon={Calculator}
            color="amber"
          />
          <QuickActionCard
            to="/ledger"
            title="Ledger"
            description="View all transactions"
            icon={BookOpen}
            color="indigo"
          />
          <QuickActionCard
            to="/inventory"
            title="Inventory"
            description="Stock overview & updates"
            icon={Package}
            color="blue"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <Clock className="h-5 w-5 text-zinc-400" /> Recent Activity
        </h2>
        <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl overflow-hidden">
          <div className="divide-y divide-zinc-800/50">
            {recentRecords.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                No recent records found.
              </div>
            ) : (
              recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-10 w-10 shrink-0 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-200">
                          Record #{record.id}
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-zinc-900 text-zinc-400 border-zinc-800 uppercase text-[10px] tracking-wider"
                        >
                          {record.transaction_type}
                        </Badge>
                        {record.bill_id && (
                          <Badge
                            variant="outline"
                            className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]"
                          >
                            Billed
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-zinc-400 flex items-center gap-1.5 flex-wrap">
                        <span>
                          {format(new Date(record.date), "MMM d, yyyy")}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span>Site #{record.site_id}</span>
                        {record.vehicle_no && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="font-mono">
                              {record.vehicle_no}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="shrink-0 self-start sm:self-center hover:bg-zinc-800 hover:text-white"
                  >
                    <Link
                      to="/records/$recordId"
                      params={{ recordId: record.id.toString() }}
                    >
                      View Details
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </div>
          <div className="p-3 bg-zinc-950/50 border-t border-zinc-800/50 flex justify-center">
            <Button
              variant="link"
              className="text-zinc-400 hover:text-white text-xs"
              asChild
            >
              <Link to="/records">View All Records</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- Sub-components ---

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  trend: string;
  color: "blue" | "emerald" | "amber" | "rose" | "indigo";
}) {
  const colorStyles = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  const gradientStyles = {
    blue: "from-blue-500/5 to-transparent",
    emerald: "from-emerald-500/5 to-transparent",
    amber: "from-amber-500/5 to-transparent",
    rose: "from-rose-500/5 to-transparent",
    indigo: "from-indigo-500/5 to-transparent",
  };

  return (
    <Card
      className={`relative overflow-hidden bg-zinc-900/40 border-zinc-800/60 shadow-lg`}
    >
      <div
        className={`absolute inset-0 bg-linear-to-br ${gradientStyles[color]} opacity-50 pointer-events-none`}
      />
      <CardContent className="p-4 sm:p-6 relative z-10 flex flex-col justify-between h-full space-y-4">
        <div className="flex items-center justify-between">
          <div
            className={`p-2.5 rounded-xl ${colorStyles[color]} shadow-inner`}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <TrendingUp className="h-4 w-4 text-zinc-500" />
        </div>
        <div>
          <h3 className="text-zinc-400 text-xs sm:text-sm font-medium">
            {title}
          </h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {value.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  to,
  title,
  description,
  icon: Icon,
  color,
}: {
  to: string;
  title: string;
  description: string;
  icon: any;
  color: "blue" | "emerald" | "amber" | "rose" | "indigo";
}) {
  const glowStyles = {
    blue: "bg-blue-500/5 group-hover:bg-blue-500/10",
    emerald: "bg-emerald-500/5 group-hover:bg-emerald-500/10",
    amber: "bg-amber-500/5 group-hover:bg-amber-500/10",
    rose: "bg-rose-500/5 group-hover:bg-rose-500/10",
    indigo: "bg-indigo-500/5 group-hover:bg-indigo-500/10",
  };

  const iconStyles = {
    blue: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20",
  };

  const textStyles = {
    blue: "text-blue-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
    indigo: "text-indigo-400",
  };

  return (
    <Link
      to={to}
      className="group relative flex flex-col justify-between p-5 sm:p-6 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl h-40"
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-colors duration-500 ${glowStyles[color]}`}
      />

      <div className="flex items-center gap-4 relative z-10">
        <div
          className={`p-3 rounded-xl transition-colors duration-300 ${iconStyles[color]}`}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <h3 className="font-bold text-zinc-100 text-base sm:text-lg tracking-tight group-hover:translate-x-1 transition-transform duration-300">
          {title}
        </h3>
      </div>

      <div className="relative z-10">
        <p className="text-xs text-zinc-400 mb-2 font-medium">{description}</p>
        <div
          className={`flex items-center text-xs sm:text-sm font-semibold ${textStyles[color]} group-hover:translate-x-1 transition-transform duration-300`}
        >
          Go to {title.toLowerCase()}{" "}
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}
