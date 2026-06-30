import { AlertCircle, ChevronDown, ChevronRight, Database } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorAlertProps {
  error: Error | string | null | undefined;
  title?: string;
}

export function ErrorAlert({ error, title = "Error" }: ErrorAlertProps) {
  const [showRaw, setShowRaw] = useState(false);

  if (!error) return null;

  // 1. Extract the raw message string and try to parse/retrieve structured details
  let parsedJson: any = null;
  let rawMessage = "";

  if (typeof error === "string") {
    rawMessage = error;
    try {
      parsedJson = JSON.parse(error);
    } catch (_e) {
      // Not JSON
    }
  } else if (error && typeof error === "object") {
    rawMessage = error.message || "";
    // Check if the error object itself carries custom fields directly (like ApiError)
    if (
      "details" in error ||
      "resolution" in error ||
      "type" in error ||
      "code" in error
    ) {
      parsedJson = error;
    } else {
      // Try to parse it if message is a JSON string
      try {
        parsedJson = JSON.parse(rawMessage);
      } catch (_e) {
        // Not JSON
      }
    }
  }

  // --- RENDERERS ---

  // A. Handle JSON Error (API / Validation / Conflict)
  if (parsedJson && typeof parsedJson === "object") {
    const errorCode = parsedJson.code;
    const errorType = parsedJson.type || "Error";
    const errorMessage =
      parsedJson.message || rawMessage || "An unknown error occurred";
    const errorDetails = parsedJson.details;
    const errorResolution = parsedJson.resolution;

    // Humanize error type. E.g. "Conflict_Error" -> "Conflict Error"
    const humanizedType = String(errorType)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    const displayTitle = errorCode
      ? `${humanizedType} (${errorCode})`
      : humanizedType;

    // Determine if it is a database/conflict/unique constraint error to show database icon
    const isDbError =
      parsedJson.type === "Conflict_Error" ||
      String(errorMessage).toLowerCase().includes("database") ||
      (errorDetails &&
        typeof errorDetails === "object" &&
        JSON.stringify(errorDetails).includes("UNIQUE constraint failed")) ||
      rawMessage.includes("UNIQUE constraint failed");

    return (
      <Alert
        variant="destructive"
        className="animate-in fade-in slide-in-from-top-2 border-rose-500/20 bg-rose-950/10 text-rose-200"
      >
        {isDbError ? (
          <Database className="h-4 w-4 text-rose-400" />
        ) : (
          <AlertCircle className="h-4 w-4 text-rose-400" />
        )}
        <AlertTitle className="text-rose-200 font-semibold flex items-center gap-2">
          {displayTitle || title}
        </AlertTitle>
        <AlertDescription className="mt-2 text-sm space-y-3">
          {/* Main Message */}
          <div className="font-medium text-rose-300">{errorMessage}</div>

          {/* Details / Field Errors */}
          {errorDetails && (
            <div className="bg-rose-950/40 border border-rose-900/30 p-3 rounded-lg text-xs font-mono text-rose-300 space-y-1">
              <div className="font-semibold text-rose-400/80 uppercase tracking-wider text-[10px] mb-1">
                Error Details
              </div>
              {typeof errorDetails === "object" ? (
                Object.entries(errorDetails).map(([key, val]) => (
                  <div key={key} className="flex items-start gap-2">
                    <span className="opacity-60 font-semibold min-w-[100px] select-none">
                      {key}:
                    </span>
                    <span className="break-all">
                      {typeof val === "object"
                        ? JSON.stringify(val)
                        : String(val)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="break-all">{String(errorDetails)}</div>
              )}
            </div>
          )}

          {/* Resolution Hint */}
          {errorResolution && (
            <div className="bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 p-3 rounded-lg text-xs flex items-start gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider text-[10px] select-none mt-0.5">
                Tip
              </span>
              <span className="leading-relaxed">{errorResolution}</span>
            </div>
          )}

          {/* Collapsible Raw Error */}
          <div className="mt-3 border-t border-rose-900/20 pt-2">
            <button
              type="button"
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center gap-1 text-[11px] font-medium text-rose-400/70 hover:text-rose-300 transition-colors cursor-pointer select-none"
            >
              {showRaw ? (
                <>
                  <ChevronDown className="h-3 w-3" /> Hide Full Error
                </>
              ) : (
                <>
                  <ChevronRight className="h-3 w-3" /> Show Full Error
                </>
              )}
            </button>
            {showRaw && (
              <pre className="mt-2 bg-rose-950/60 border border-rose-900/40 p-2.5 rounded-md text-[10px] font-mono text-rose-300 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                {typeof error === "object"
                  ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
                  : String(error)}
              </pre>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // B. Handle Database Constraint Error (SQLite)
  if (rawMessage.includes("UNIQUE constraint failed")) {
    const fields = rawMessage.split(":")[1]?.trim() || "";
    // Convert "customers.name, customers.address" -> "Name, Address"
    const readableFields = fields
      .split(",")
      .map((f) => {
        const parts = f.trim().split(".");
        // Capitalize the column name (e.g., 'name' -> 'Name')
        const col = parts[parts.length - 1];
        return col.charAt(0).toUpperCase() + col.slice(1);
      })
      .join(" & ");

    return (
      <Alert
        variant="destructive"
        className="animate-in fade-in slide-in-from-top-2"
      >
        <Database className="h-4 w-4" />
        <AlertTitle>Duplicate Entry</AlertTitle>
        <AlertDescription className="mt-2 text-sm">
          <div>
            A customer with this <strong>{readableFields}</strong> already
            exists. Please check your data or use a different value.
          </div>

          {/* Collapsible Raw Error */}
          <div className="mt-3 border-t border-destructive/20 pt-2">
            <button
              type="button"
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center gap-1 text-[11px] font-medium text-destructive-foreground/70 hover:text-destructive-foreground transition-colors cursor-pointer select-none"
            >
              {showRaw ? (
                <>
                  <ChevronDown className="h-3 w-3" /> Hide Full Error
                </>
              ) : (
                <>
                  <ChevronRight className="h-3 w-3" /> Show Full Error
                </>
              )}
            </button>
            {showRaw && (
              <pre className="mt-2 bg-destructive/10 border border-destructive/20 p-2.5 rounded-md text-[10px] font-mono text-destructive-foreground/90 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                {typeof error === "object"
                  ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
                  : String(error)}
              </pre>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // C. Fallback: Generic Plain Text Error
  return (
    <Alert
      variant="destructive"
      className="animate-in fade-in slide-in-from-top-2"
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2 text-sm">
        <div>{rawMessage}</div>

        {/* Collapsible Raw Error */}
        <div className="mt-3 border-t border-destructive/20 pt-2">
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-1 text-[11px] font-medium text-destructive-foreground/70 hover:text-destructive-foreground transition-colors cursor-pointer select-none"
          >
            {showRaw ? (
              <>
                <ChevronDown className="h-3 w-3" /> Hide Full Error
              </>
            ) : (
              <>
                <ChevronRight className="h-3 w-3" /> Show Full Error
              </>
            )}
          </button>
          {showRaw && (
            <pre className="mt-2 bg-destructive/10 border border-destructive/20 p-2.5 rounded-md text-[10px] font-mono text-destructive-foreground/90 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
              {typeof error === "object"
                ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
                : String(error)}
            </pre>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
