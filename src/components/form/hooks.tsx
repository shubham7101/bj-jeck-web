import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { FormInput } from "./FormInput"; // Adjust paths
import { FormTextarea } from "./FormTextarea";
import { FormSelect } from "./FormSelect";
import { FormCheckbox } from "./FormCheckbox";
import { FormRadioGroup } from "./FormRadioGroup";

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
