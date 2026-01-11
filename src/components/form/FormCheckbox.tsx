import { Checkbox } from "@/components/ui/checkbox";
import { FormBase } from "./FormBase";
import type { BaseFormControlProps } from "./types";

export function FormCheckbox({ field, ...props }: BaseFormControlProps) {
  const isInvalid =
    field.state.meta.isTouched && field.state.meta.errors.length > 0;

  return (
    <FormBase field={field} {...props} controlFirst>
      <Checkbox
        id={field.name}
        name={field.name}
        checked={field.state.value}
        onBlur={field.handleBlur}
        onCheckedChange={(checked) => field.handleChange(checked === true)}
        className={isInvalid ? "border-destructive" : ""}
        aria-invalid={isInvalid}
      />
    </FormBase>
  );
}
