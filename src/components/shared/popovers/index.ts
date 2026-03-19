/**
 * Shared Popover Content Components
 *
 * Reusable popover contents used by both Chips (forms) and Column Factories (tables).
 * Each component renders the INNER content — the container (Popover/PopoverContent)
 * is managed by the consumer (ChipBase, cell wrapper, etc.)
 */

export { WalletPopoverContent, type WalletPopoverOption, type WalletPopoverContentProps } from "./wallet-popover-content";
export { CurrencyPopoverContent, type CurrencyPopoverOption, type CurrencyPopoverContentProps } from "./currency-popover-content";
export { StatusPopoverContent, StatusDot, type StatusPopoverOption, type StatusPopoverContentProps, type StatusVariant } from "./status-popover-content";
export { SelectPopoverContent, type SelectPopoverOption, type SelectPopoverContentProps } from "./select-popover-content";
export { CategoryPopoverContent, type CategoryPopoverOption, type CategoryPopoverContentProps } from "./category-popover-content";
export { AttachmentPopoverContent, AttachmentLabel, type AttachmentPopoverContentProps } from "./attachment-popover-content";
export { ColorPopoverContent, STANDARD_COLORS, type ColorPopoverContentProps } from "./color-popover-content";
export { AddressPopoverContent, type AddressData, type AddressPopoverContentProps } from "./address-popover-content";
export { UnitPopoverContent, type UnitPopoverOption, type UnitPopoverContentProps } from "./unit-popover-content";
