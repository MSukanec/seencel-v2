/**
 * Form Field Factory System
 * Standard 19.10 - Composable Form Fields
 * 
 * This module exports pre-built, reusable form field components.
 * Each field encapsulates:
 * - The FormGroup wrapper with label
 * - The input component (Select, Input, etc.)
 * - Common validation patterns
 * - Consistent styling and behavior
 * 
 * Usage:
 * <CurrencyField value={currencyId} onChange={setCurrencyId} currencies={currencies} />
 */

export { CurrencyField, type CurrencyFieldProps } from "./currency-field";
export { WalletField, type WalletFieldProps } from "./wallet-field";
export { ProjectField, type ProjectFieldProps } from "./project-field";
export { AmountField, type AmountFieldProps } from "./amount-field";
export { DateField, type DateFieldProps } from "./date-field";
export { NotesField, type NotesFieldProps } from "./notes-field";
export { ReferenceField, type ReferenceFieldProps } from "./reference-field";
export { ExchangeRateField, type ExchangeRateFieldProps } from "./exchange-rate-field";
export { ContactField, type ContactFieldProps, type Contact } from "./contact-field";
export { TimeField, type TimeFieldProps } from "./time-field";
export { TextField, type TextFieldProps } from "./text-field";
export { SwitchField, type SwitchFieldProps } from "./switch-field";
export { ColorField, type ColorFieldProps } from "./color-field";
export { UploadField, type UploadFieldProps } from "./upload-field";
export { AssignedToField, type AssignedToFieldProps, type AssignableMember } from "./assigned-to-field";
export { ActiveProjectField, type ActiveProjectFieldProps, type ActiveProject } from "./active-project-field";
export { SelectField, type SelectFieldProps, type SelectOption, type SelectGroup, type FilterTab, type SelectEmptyState } from "./select-field";
export { SegmentedField, type SegmentedFieldProps, type SegmentedOption } from "./segmented-field";
export { PhoneField, type PhoneFieldProps } from "./phone-field";
