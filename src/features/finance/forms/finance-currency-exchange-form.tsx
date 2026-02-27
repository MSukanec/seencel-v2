"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

import { FormFooter } from "@/components/shared/forms/form-footer";
import { formatDateForDB } from "@/lib/timezone-data";
import { createCurrencyExchange } from "@/features/finance/actions";
import { useFormData } from "@/stores/organization-store";

// Field Factories - Standard 19.10
import {
    DateField,
    WalletField,
    CurrencyField,
    AmountField,
    NotesField,
} from "@/components/shared/forms/fields";

interface CurrencyExchangeFormProps {
    organizationId?: string; // Optional - falls back to store
    projectId?: string;
    wallets?: { id: string; wallet_name: string; currency_code?: string }[]; // Optional - falls back to store
    currencies?: { id: string; name: string; code: string; symbol: string }[]; // Optional - falls back to store
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function CurrencyExchangeForm({
    organizationId: propOrgId,
    projectId,
    wallets: propWallets,
    currencies: propCurrencies,
    onSuccess,
    onCancel,
}: CurrencyExchangeFormProps) {
    // Get data from Zustand store (works in portals/modals)
    const storeData = useFormData();

    // Use props if provided, otherwise fallback to store (Hybrid Autonomy Pattern)
    const organizationId = propOrgId || storeData.activeOrgId || "";
    const wallets = useMemo(() => {
        if (propWallets && propWallets.length > 0) return propWallets;
        return storeData.wallets.map(w => ({ id: w.id, wallet_name: w.name, currency_code: w.currency_code }));
    }, [propWallets, storeData.wallets]);
    const currencies = useMemo(() => {
        if (propCurrencies && propCurrencies.length > 0) return propCurrencies;
        return storeData.currencies;
    }, [propCurrencies, storeData.currencies]);

    // Form state
    const [operationDate, setOperationDate] = useState<Date>(new Date());
    const [description, setDescription] = useState("");

    // Origin (Vendo)
    const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id || "");
    const [fromCurrencyId, setFromCurrencyId] = useState(currencies[0]?.id || "");
    const [fromAmount, setFromAmount] = useState("");

    // Destination (Compro)
    const [toWalletId, setToWalletId] = useState(wallets[0]?.id || "");
    const [toCurrencyId, setToCurrencyId] = useState(currencies[1]?.id || currencies[0]?.id || "");
    const [toAmount, setToAmount] = useState("");

    // Calculated exchange rate
    const exchangeRate = fromAmount && toAmount && parseFloat(fromAmount) > 0
        ? (parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(2)
        : null;

    // Update default values when data loads
    useEffect(() => {
        if (!fromWalletId && wallets.length > 0) {
            setFromWalletId(wallets[0].id);
        }
        if (!toWalletId && wallets.length > 0) {
            setToWalletId(wallets[0].id);
        }
    }, [wallets, fromWalletId, toWalletId]);

    useEffect(() => {
        if (currencies.length > 0) {
            if (!fromCurrencyId) setFromCurrencyId(currencies[0].id);
            if (!toCurrencyId && currencies.length > 1) setToCurrencyId(currencies[1].id);
        }
    }, [currencies, fromCurrencyId, toCurrencyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fromAmount || parseFloat(fromAmount) <= 0) {
            toast.error("Ingresá el monto que vendés");
            return;
        }

        if (!toAmount || parseFloat(toAmount) <= 0) {
            toast.error("Ingresá el monto que comprás");
            return;
        }

        if (fromCurrencyId === toCurrencyId) {
            toast.error("Las monedas deben ser diferentes");
            return;
        }

        // ✅ OPTIMISTIC: Close and show success immediately
        onSuccess?.();
        toast.success("Cambio de moneda registrado");

        // 🔄 BACKGROUND: Submit to server
        try {
            const result = await createCurrencyExchange({
                organization_id: organizationId,
                project_id: projectId,
                operation_date: formatDateForDB(operationDate)!,
                description: description || undefined,
                from_wallet_id: fromWalletId,
                from_currency_id: fromCurrencyId,
                from_amount: parseFloat(fromAmount),
                to_wallet_id: toWalletId,
                to_currency_id: toCurrencyId,
                to_amount: parseFloat(toAmount),
            });

            if (!result.success) {
                toast.error(result.error || "Error al registrar cambio");
            }
        } catch (error: any) {
            console.error("Error creating currency exchange:", error);
            toast.error(error.message || "Error al registrar cambio");
        }
    };

    const fromCurrency = currencies.find(c => c.id === fromCurrencyId);
    const toCurrency = currencies.find(c => c.id === toCurrencyId);

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    {/* Date */}
                    <DateField
                        label="Fecha de Operación"
                        value={operationDate}
                        onChange={(date: Date | undefined) => date && setOperationDate(date)}
                    />

                    {/* Two column layout for Vendo / Compro - side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* ORIGIN: Vendo */}
                        <div className="p-4 rounded-lg border bg-amount-negative/10 border-amount-negative/20">
                            <h4 className="text-sm font-medium text-amount-negative mb-3">Vendo (Sale)</h4>
                            <div className="space-y-4">
                                <WalletField
                                    label="Billetera Origen"
                                    value={fromWalletId}
                                    onChange={setFromWalletId}
                                    wallets={wallets}
                                />

                                <CurrencyField
                                    value={fromCurrencyId}
                                    onChange={setFromCurrencyId}
                                    currencies={currencies}
                                />

                                <AmountField
                                    value={fromAmount}
                                    onChange={setFromAmount}
                                />
                            </div>
                        </div>

                        {/* DESTINATION: Compro */}
                        <div className="p-4 rounded-lg border bg-amount-positive/10 border-amount-positive/20">
                            <h4 className="text-sm font-medium text-amount-positive mb-3">Compro (Entra)</h4>
                            <div className="space-y-4">
                                <WalletField
                                    label="Billetera Destino"
                                    value={toWalletId}
                                    onChange={setToWalletId}
                                    wallets={wallets}
                                />

                                <CurrencyField
                                    value={toCurrencyId}
                                    onChange={setToCurrencyId}
                                    currencies={currencies}
                                />

                                <AmountField
                                    value={toAmount}
                                    onChange={setToAmount}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Exchange Rate (calculated) */}
                    {exchangeRate && (
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                            <span className="text-sm text-muted-foreground">Tipo de cambio: </span>
                            <span className="font-mono font-medium">
                                1 {fromCurrency?.code} = {exchangeRate} {toCurrency?.code}
                            </span>
                        </div>
                    )}

                    {/* Description */}
                    <NotesField
                        label="Descripción (opcional)"
                        value={description}
                        onChange={setDescription}
                        placeholder="Ej: Compra de dólares en banco"
                        rows={2}
                        required={false}
                    />
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                submitLabel="Registrar Cambio"
                onCancel={onCancel}
            />
        </form>
    );
}
