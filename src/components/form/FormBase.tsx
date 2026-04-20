import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { BaseFormControlProps } from "./types";

type FormBaseProps = BaseFormControlProps & {
  children: React.ReactNode;
  horizontal?: boolean;
  controlFirst?: boolean;
  className?: string;
};

export function FormBase({
  children,
  field,
  label,
  description,
  controlFirst = false,
  horizontal = false,
  className,
}: FormBaseProps) {
  // Tanstack form state access
  const meta = field.state.meta;
  const rawErrors = meta.errors || [];
  const isTouched = meta.isTouched;
  const isInvalid = isTouched && rawErrors.length > 0;

  // Standardize Error Messages
  const errors = rawErrors.map((err: any) => {
    if (typeof err === "string") return { message: err };
    if (typeof err === "object" && err !== null && "message" in err)
      return err as { message: string };
    return { message: "Invalid value" };
  });

  const labelElement = label ? (
    <>
      <FieldLabel
        htmlFor={field.name}
        className={cn("text-zinc-400", isInvalid ? "text-rose-500" : "")}
      >
        {label}
      </FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
    </>
  ) : null;

  return (
    <Field
      data-invalid={isInvalid}
      orientation={horizontal ? "horizontal" : "vertical"}
      // CHANGE 1: Added 'relative' and 'mb-5' to create context and visual spacing
      className={cn("relative mb-5", className)}
    >
      {controlFirst ? (
        // Checkbox/Radio Layout
        <div className="flex items-start gap-2">
          {children}
          <div className="space-y-1">
            {labelElement}
            {/* CHANGE 2: Absolute positioning for Checkbox errors */}
            {isInvalid && (
              <div className="absolute top-full left-0 pt-1 z-10 w-full">
                <FieldError
                  errors={errors}
                  className="text-[0.8rem] text-rose-500 font-medium"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        // Standard Input Layout
        <>
          <FieldContent>{labelElement}</FieldContent>
          {children}
          {/* CHANGE 3: Absolute positioning for Input errors */}
          {isInvalid && (
            <div className="absolute top-full left-0 pt-1 z-10 w-full pointer-events-none">
              <FieldError
                errors={errors}
                className="text-destructive text-xs mt-1"
              />
            </div>
          )}
        </>
      )}
    </Field>
  );
}
