/**
 * Wallet Field Factory (Smart)
 * Standard 19.12 - Reusable Wallet Selector
 * 
 * - Self-populating: reads wallets from useFormData() store
 * - Consistent formatting (wallet name, optionally with currency)
 * - Default wallet pre-selection
 * - Override: pass `wallets` prop to use custom list
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
import { useFormData } from "@/stores/organization-store";

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
    /** Override: pass custom wallets list. Default: reads from store */
    wallets?: Wallet[];
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
    wallets: walletsOverride,
    label = "Billetera",
    required = true,
    disabled = false,
    className,
    placeholder = "Seleccionar billetera",
    showCurrency = false,
}: WalletFieldProps) {
    // Smart: read from store by default, allow override
    const storeData = useFormData();
    const wallets = walletsOverride ?? (storeData.wallets as Wallet[]);

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
