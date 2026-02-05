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
