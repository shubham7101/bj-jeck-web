import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormBase } from "./FormBase";
import type { BaseFormControlProps } from "./types";

type FormSelectProps = BaseFormControlProps & {
  children: ReactNode;
  placeholder?: string;
};

export function FormSelect({
  field,
  children,
  placeholder,
  ...props
}: FormSelectProps) {
  const isInvalid =
    field.state.meta.isTouched && field.state.meta.errors.length > 0;

  return (
    <FormBase field={field} {...props}>
      <Select
        name={field.name}
        value={String(field.state.value ?? "")}
        onValueChange={(val) => field.handleChange(val)}
      >
        <SelectTrigger
          id={field.name}
          onBlur={field.handleBlur}
          className={
            isInvalid ? "border-destructive focus:ring-destructive" : ""
          }
          aria-invalid={isInvalid}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </FormBase>
  );
}
