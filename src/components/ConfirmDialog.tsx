import { Loader2, Trash, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isPending?: boolean;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isPending = false,
  isDestructive = true,
}: ConfirmDialogProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isPending && onClose()}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md scale-100 bg-zinc-950 border border-zinc-800 p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 mx-4">
        <button
          onClick={() => !isPending && onClose()}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            {title}
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto border-zinc-700 hover:bg-zinc-800 text-zinc-300"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              "w-full sm:w-auto text-white",
              isDestructive
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-emerald-600 hover:bg-emerald-500",
            )}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : isDestructive ? (
              <Trash className="h-4 w-4 mr-2" />
            ) : null}
            {isPending ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
