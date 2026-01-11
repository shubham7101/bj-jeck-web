import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileJson, Database } from "lucide-react";

interface ErrorAlertProps {
  error: Error | string | null | undefined;
  title?: string;
}

export function ErrorAlert({ error, title = "Error" }: ErrorAlertProps) {
  if (!error) return null;

  // 1. Extract the raw message string
  const rawMessage = typeof error === "string" ? error : error.message;

  // 2. Try to parse it as JSON
  let parsedJson: any = null;
  try {
    parsedJson = JSON.parse(rawMessage);
  } catch (e) {
    // Not JSON, ignore
  }

  // --- RENDERERS ---

  // A. Handle JSON Error (API / Validation)
  if (parsedJson && typeof parsedJson === "object") {
    return (
      <Alert
        variant="destructive"
        className="animate-in fade-in slide-in-from-top-2"
      >
        <FileJson className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2 text-sm">
          {/* Main Message */}
          <div className="font-medium mb-1">
            {parsedJson.message || "An unknown error occurred"}
          </div>

          {/* Details / Field Errors */}
          {parsedJson.details && (
            <div className="bg-destructive/10 p-2 rounded-md text-xs font-mono mb-2">
              {typeof parsedJson.details === "object"
                ? // Handle { field: "names" } or Array
                  Object.entries(parsedJson.details).map(([key, val]) => (
                    <div key={key}>
                      <span className="opacity-70">{key}:</span> {String(val)}
                    </div>
                  ))
                : String(parsedJson.details)}
            </div>
          )}

          {/* Resolution Hint */}
          {parsedJson.resolution && (
            <div className="text-destructive-foreground/80 text-xs italic">
              <strong>Tip:</strong> {parsedJson.resolution}
            </div>
          )}
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
        <AlertDescription>
          A customer with this <strong>{readableFields}</strong> already exists.
          Please check your data or use a different value.
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
      <AlertDescription>{rawMessage}</AlertDescription>
    </Alert>
  );
}
