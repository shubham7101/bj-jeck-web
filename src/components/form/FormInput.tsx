import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FormBase } from "./FormBase";
import type { BaseFormControlProps } from "./types";

interface FormInputProps
  extends
    BaseFormControlProps,
    Omit<
      React.ComponentProps<"input">,
      "value" | "onChange" | "onBlur" | "name"
    > {}

export function FormInput({
  field,
  label,
  icon,
  description,
  className,
  type = "text",
  ...props
}: FormInputProps) {
  const isInvalid =
    field.state.meta.isTouched && field.state.meta.errors.length > 0;

  return (
    <FormBase
      field={field}
      label={label}
      description={description}
      className={className}
    >
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}

        <Input
          {...props}
          id={field.name}
          name={field.name}
          type={type}
          value={field.state.value ?? ""}
          onBlur={field.handleBlur}
          onChange={(e) => {
            if (type === "number") {
              const value = e.target.valueAsNumber;
              field.handleChange(isNaN(value) ? "" : value);
            } else {
              field.handleChange(e.target.value);
            }
          }}
          className={cn(
            icon && "pl-9",
            isInvalid && "border-destructive focus-visible:ring-destructive"
          )}
          aria-invalid={isInvalid}
        />
      </div>
    </FormBase>
  );
}
