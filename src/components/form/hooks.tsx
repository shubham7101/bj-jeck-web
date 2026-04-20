import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { FormCheckbox } from "./FormCheckbox";
import { FormInput } from "./FormInput"; // Adjust paths
import { FormRadioGroup } from "./FormRadioGroup";
import { FormSelect } from "./FormSelect";
import { FormTextarea } from "./FormTextarea";

// Extract contexts
const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

// Initialize hook with typed components
const { useAppForm } = createFormHook({
  fieldComponents: {
    Input: FormInput,
    Textarea: FormTextarea,
    Select: FormSelect,
    Checkbox: FormCheckbox,
    RadioGroup: FormRadioGroup,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

export { useAppForm, useFieldContext, useFormContext };
