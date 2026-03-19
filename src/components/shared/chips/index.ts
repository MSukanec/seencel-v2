/**
 * Chip System — Public API
 *
 * Unified chip components for forms, tables, and detail panels.
 * Each chip renders as a clickeable pill with a popover selector.
 */

// Base
export { ChipBase, type ChipBaseProps } from "./chip-base";
export { ChipRow, type ChipRowProps } from "./chip-row";

// Concrete chips
export { StatusChip, type StatusChipProps, type StatusOption, type StatusVariant } from "./chips/status-chip";
export { SelectChip, type SelectChipProps, type SelectChipOption } from "./chips/select-chip";
export { UnitChip, type UnitChipProps } from "./chips/unit-chip";
export { WalletChip, type WalletChipProps, type WalletChipOption } from "./chips/wallet-chip";
export { CurrencyChip, type CurrencyChipProps, type CurrencyChipOption } from "./chips/currency-chip";
export { CategoryChip, type CategoryChipProps } from "./chips/category-chip";
export { DateChip, type DateChipProps } from "./chips/date-chip";
export { PeriodChip, type PeriodChipProps, type PeriodGranularity } from "./chips/period-chip";
export { AttachmentChip, type AttachmentChipProps } from "./chips/attachment-chip";
export { ColorChip, type ColorChipProps } from "./chips/color-chip";
export { AddressChip, type AddressChipProps, type AddressData } from "./chips/address-chip";
export { TimeChip, type TimeChipProps } from "./chips/time-chip";
export { LocationChip, type LocationChipProps } from "./chips/location-chip";
export { ProjectChip, type ProjectChipProps, type ProjectChipProject } from "./chips/project-chip";
export { DateTimeRangeChip, type DateTimeRangeChipProps } from "./chips/date-time-range-chip";
