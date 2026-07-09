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
          "bg-zinc-950 border-zinc-800 shadow-lg relative overflow-hidden py-0 gap-0",
          className,
        )}
      >
        {children}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6 sm:pb-2 relative z-10">
          <Skeleton className="h-4 w-24 bg-zinc-800" />
          <Skeleton className="h-7 w-7 sm:h-9 sm:w-9 rounded-md bg-zinc-800" />
        </CardHeader>
        <CardContent className="relative z-10 p-4 pt-0 sm:p-6 sm:pt-0">
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
        "group relative overflow-hidden bg-zinc-950 border-zinc-800 shadow-lg shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/50 py-1 gap-2",
        className,
      )}
    >
      {/* Subtle Gradient Background Effect on Hover */}
      <div className="absolute inset-0 bg-linear-to-br from-zinc-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {children}

      <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors pr-2 leading-tight">
          {title}
        </CardTitle>

        {/* Icon Container */}
        <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-md bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-inner group-hover:text-zinc-200 group-hover:border-zinc-700 transition-all duration-300 shrink-0 [&>svg]:h-3 [&>svg]:w-3 sm:[&>svg]:h-4 sm:[&>svg]:w-4">
          {icon}
        </div>
      </CardHeader>

      <CardContent className="relative z-10 p-4 pt-0 sm:p-6 sm:pt-0">
        {/* Main Value with Optional Custom Color */}
        <div
          className={`text-base sm:text-2xl font-bold tracking-tight truncate ${valueColor}`}
          title={String(value)}
        >
          {value}
        </div>

        {/* Subtext with Smart Trend Styling */}
        <div
          className={`
            text-[10px] sm:text-xs mt-1 font-medium flex items-center gap-1 transition-colors leading-tight line-clamp-2
            ${isPositive ? "text-emerald-500" : ""}
            ${isNegative ? "text-rose-500" : ""}
            ${!isPositive && !isNegative ? "text-zinc-500" : ""}
          `}
          title={isString ? subText : ""}
        >
          {subText}
        </div>
      </CardContent>
    </Card>
  );
}
