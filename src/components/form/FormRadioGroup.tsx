import type { ReactNode } from "react";
import { RadioGroup } from "@/components/ui/radio-group";
import { FormBase } from "./FormBase";
import type { BaseFormControlProps } from "./types";

type FormRadioGroupProps = BaseFormControlProps &
  Omit<
    React.ComponentProps<typeof RadioGroup>,
    "value" | "onValueChange" | "name"
  > & {
    children: ReactNode;
  };

export function FormRadioGroup({
  field,
  children,
  className,
  ...props
}: FormRadioGroupProps) {
  return (
    <FormBase field={field} className={className} {...props}>
      <RadioGroup
        {...props}
        id={field.name}
        name={field.name}
        value={field.state.value}
        onValueChange={(val) => field.handleChange(val)}
        className="flex flex-col space-y-2"
      >
        {children}
      </RadioGroup>
    </FormBase>
  );
}
