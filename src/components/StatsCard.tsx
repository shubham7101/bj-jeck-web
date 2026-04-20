import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

export interface StatsCardProps {
  title: string;
  value: string | number;
  subText: string | ReactNode;
  icon: React.ReactNode;
  valueColor?: string;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function StatsCard({
  title,
  value,
  subText,
  icon,
  valueColor = "text-zinc-100",
  loading,
  className,
  children,
}: StatsCardProps) {
  if (loading) {
    return (
      <Card
        className={cn(
          "bg-zinc-950 border-zinc-800 shadow-lg relative overflow-hidden",
          className,
        )}
      >
        {children}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <Skeleton className="h-4 w-24 bg-zinc-800" />
          <Skeleton className="h-9 w-9 rounded-md bg-zinc-800" />
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-2xl font-bold">
            <Skeleton className="h-8 w-16 bg-zinc-800 mb-1" />
          </div>
          <Skeleton className="h-3 w-32 bg-zinc-800" />
        </CardContent>
      </Card>
    );
  }

  // Check if subText is a string before calling startsWith
  const isString = typeof subText === "string";
  const isPositive = isString && subText.startsWith("+");
  const isNegative = isString && subText.startsWith("-");

  return (
    <Card
      className={cn(
        "group relative overflow-hidden bg-zinc-950 border-zinc-800 shadow-lg shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/50",
        className,
      )}
    >
      {/* Subtle Gradient Background Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {children}

      <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
          {title}
        </CardTitle>

        {/* Icon Container */}
        <div className="h-9 w-9 rounded-md bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-inner group-hover:text-zinc-200 group-hover:border-zinc-700 transition-all duration-300">
          {icon}
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        {/* Main Value with Optional Custom Color */}
        <div className={`text-2xl font-bold tracking-tight ${valueColor}`}>
          {value}
        </div>

        {/* Subtext with Smart Trend Styling */}
        <div
          className={`
            text-xs mt-1 font-medium flex items-center gap-1 transition-colors
            ${isPositive ? "text-emerald-500" : ""}
            ${isNegative ? "text-rose-500" : ""}
            ${!isPositive && !isNegative ? "text-zinc-500" : ""}
          `}
        >
          {subText}
        </div>
      </CardContent>
    </Card>
  );
}
