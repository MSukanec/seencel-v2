/**
 * Wallet Field Factory
 * Standard 19.12 - Reusable Wallet Selector
 * 
 * Provides a standardized wallet selector with:
 * - Consistent formatting (wallet name, optionally with currency)
 * - Default wallet pre-selection
 * - Support for disabled state
 */

"use client";

import { FormGroup } from "@/components/ui/form-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FactoryLabel } from "./field-wrapper";

export interface Wallet {
    id: string;
    name?: string;
    wallet_name?: string;
    currency_symbol?: string;
    is_default?: boolean;
}

export interface WalletFieldProps {
    /** Current selected wallet ID */
    value: string;
    /** Callback when wallet changes */
    onChange: (value: string) => void;
    /** List of available wallets */
    wallets: Wallet[];
    /** Field label (default: "Billetera") */
    label?: string;
    /** Is field required? (default: true) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Show currency symbol next to wallet name */
    showCurrency?: boolean;
}

export function WalletField({
    value,
    onChange,
    wallets,
    label = "Billetera",
    required = true,
    disabled = false,
    className,
    placeholder = "Seleccionar billetera",
    showCurrency = false,
}: WalletFieldProps) {
    const getWalletLabel = (wallet: Wallet) => {
        const name = wallet.wallet_name || wallet.name || "Billetera";
        if (showCurrency && wallet.currency_symbol) {
            return `${name} (${wallet.currency_symbol})`;
        }
        return name;
    };

    return (
        <FormGroup label={<FactoryLabel label={label} />} required={required} className={className}>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                            {getWalletLabel(wallet)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </FormGroup>
    );
}
