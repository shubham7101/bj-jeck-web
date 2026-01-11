// components/form/types.ts
import type { FieldApi } from "@tanstack/react-form";
import type { ReactNode } from "react";

export type BaseFormControlProps = {
  field: FieldApi<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >;
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
  icon?: ReactNode;
};
