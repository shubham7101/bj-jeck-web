import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <div className="p-8 h-full">
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <div className="flex gap-4">
          <Button asChild>
            <Link to="/customer-rates">View Customers Rates</Link>
          </Button>
          <Button asChild variant="secondary" className="border border-slate-300">
            <Link to="/customer-balances">View Customers Balances</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
