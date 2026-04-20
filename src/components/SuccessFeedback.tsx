import { Link } from "@tanstack/react-router";
import { CheckCircle2, type LucideIcon, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type DetailItem = {
  label: string;
  value: ReactNode;
};

export type ActionProps = {
  to?: string;
  params?: Record<string, string>;
  onClick?: () => void;
  label: string;
  icon: LucideIcon;
};

export interface SuccessFeedbackProps {
  title: string;
  description: ReactNode;
  details: DetailItem[];
  primaryAction: ActionProps;
  secondaryAction: ActionProps;
  onDismiss: () => void;
}

export function SuccessFeedback({
  title,
  description,
  details,
  primaryAction,
  secondaryAction,
  onDismiss,
}: SuccessFeedbackProps) {
  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <Card className="border-emerald-500/30 bg-emerald-950/10 relative overflow-hidden shadow-lg shadow-emerald-900/10">
        {/* Decorative Background Blob (Used in Customer, added here for consistent flair) */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-emerald-600 hover:text-emerald-400 hover:bg-emerald-900/30 cursor-pointer rounded-full"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close notification</span>
          </Button>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-xl text-emerald-100">
                {title}
              </CardTitle>
              <CardDescription className="text-emerald-400/80">
                {description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm bg-black/40 p-5 rounded-lg border border-emerald-500/10 backdrop-blur-md">
            {details.map((detail, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <span className="text-emerald-500/50 text-[10px] uppercase font-bold tracking-wider">
                  {detail.label}
                </span>
                <div className="font-medium text-emerald-50 text-base">
                  {detail.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="bg-emerald-950/30 py-4 flex flex-wrap gap-3 border-t border-emerald-500/10">
          {primaryAction.to ? (
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-lg shadow-emerald-900/20"
            >
              <Link to={primaryAction.to} params={primaryAction.params}>
                <primaryAction.icon className="mr-2 h-4 w-4" />
                {primaryAction.label}
              </Link>
            </Button>
          ) : (
            <Button
              onClick={primaryAction.onClick}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-lg shadow-emerald-900/20"
            >
              <primaryAction.icon className="mr-2 h-4 w-4" />
              {primaryAction.label}
            </Button>
          )}

          {secondaryAction.to ? (
            <Button
              asChild
              variant="outline"
              className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300 bg-transparent"
            >
              <Link to={secondaryAction.to} params={secondaryAction.params}>
                <secondaryAction.icon className="mr-2 h-4 w-4" />
                {secondaryAction.label}
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300 bg-transparent cursor-pointer"
            >
              <secondaryAction.icon className="mr-2 h-4 w-4" />
              {secondaryAction.label}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
