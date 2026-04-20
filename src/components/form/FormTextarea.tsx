import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FormBase } from "./FormBase";
import type { BaseFormControlProps } from "./types";

type FormTextareaProps = BaseFormControlProps &
  Omit<
    React.ComponentProps<"textarea">,
    "name" | "value" | "onChange" | "onBlur"
  >;

export function FormTextarea({
  field,
  className,
  ...props
}: FormTextareaProps) {
  const isInvalid =
    field.state.meta.isTouched && field.state.meta.errors.length > 0;

  return (
    <FormBase field={field} className={className} {...props}>
      <Textarea
        {...props}
        id={field.name}
        name={field.name}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        className={cn(
          isInvalid && "border-destructive focus-visible:ring-destructive",
        )}
        aria-invalid={isInvalid}
      />
    </FormBase>
  );
}
