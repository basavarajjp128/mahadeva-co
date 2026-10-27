export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
};

export const emptyFormState: FormState = {};
