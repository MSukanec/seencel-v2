"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ArrowRightLeft } from "lucide-react";

import { formatDateForDB } from "@/lib/timezone-data";
import { createWalletTransfer } from "@/features/finance/actions";
import { useFormData } from "@/stores/organization-store";

// Field Factories — Standard 19.10
import {
    DateField,
    WalletField,
    CurrencyField,
    AmountField,
    NotesField,
} from "@/components/shared/forms/fields";

// FormFooter for standalone usage (inside modals from other call sites)
import { FormFooter } from "@/components/shared/forms/form-footer";

interface WalletTransferFormProps {
    organizationId?: string;
    projectId?: string;
    wallets?: { id: string; wallet_name: string; currency_code?: string }[];
    currencies?: { id: string; name: string; code: string; symbol: string }[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function WalletTransferForm({
    organizationId: propOrgId,
    projectId,
    wallets: propWallets,
    currencies: propCurrencies,
    onSuccess,
    onCancel,
}: WalletTransferFormProps) {
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

    // Transfer details
    const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id || "");
    const [toWalletId, setToWalletId] = useState(wallets[1]?.id || wallets[0]?.id || "");
    const [currencyId, setCurrencyId] = useState(currencies[0]?.id || "");
    const [amount, setAmount] = useState("");

    // Update default values when data loads
    useEffect(() => {
        if (wallets.length > 0) {
            if (!fromWalletId) setFromWalletId(wallets[0].id);
            if (!toWalletId && wallets.length > 1) setToWalletId(wallets[1].id);
            else if (!toWalletId) setToWalletId(wallets[0].id);
        }
    }, [wallets, fromWalletId, toWalletId]);

    useEffect(() => {
        if (!currencyId && currencies.length > 0) {
            setCurrencyId(currencies[0].id);
        }
    }, [currencies, currencyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Ingresá el monto a transferir");
            return;
        }

        if (fromWalletId === toWalletId) {
            toast.error("Las billeteras deben ser diferentes");
            return;
        }

        // ✅ OPTIMISTIC: Close and show success immediately
        onSuccess?.();
        toast.success("Transferencia registrada");

        // 🔄 BACKGROUND: Submit to server
        try {
            const result = await createWalletTransfer({
                organization_id: organizationId,
                project_id: projectId,
                operation_date: formatDateForDB(operationDate)!,
                description: description || undefined,
                from_wallet_id: fromWalletId,
                to_wallet_id: toWalletId,
                currency_id: currencyId,
                amount: parseFloat(amount),
            });

            if (!result.success) {
                toast.error(result.error || "Error al registrar transferencia");
            }
        } catch (error: any) {
            console.error("Error creating wallet transfer:", error);
            toast.error(error.message || "Error al registrar transferencia");
        }
    };

    const fromWallet = wallets.find(w => w.id === fromWalletId);
    const toWallet = wallets.find(w => w.id === toWalletId);

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    {/* Fecha */}
                    <DateField
                        label="Fecha de Operación"
                        value={operationDate}
                        onChange={(date) => date && setOperationDate(date)}
                    />

                    {/* Billeteras */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <WalletField
                            label="Billetera Origen"
                            value={fromWalletId}
                            onChange={setFromWalletId}
                            wallets={wallets}
                        />

                        <WalletField
                            label="Billetera Destino"
                            value={toWalletId}
                            onChange={setToWalletId}
                            wallets={wallets}
                        />
                    </div>

                    {/* Visual indicator */}
                    {fromWallet && toWallet && fromWalletId !== toWalletId && (
                        <div className="flex items-center justify-center gap-3 py-2 px-4 rounded-lg bg-muted/50">
                            <span className="text-sm font-medium">{fromWallet.wallet_name}</span>
                            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{toWallet.wallet_name}</span>
                        </div>
                    )}

                    {/* Moneda y Monto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CurrencyField
                            value={currencyId}
                            onChange={setCurrencyId}
                            currencies={currencies}
                        />

                        <AmountField
                            value={amount}
                            onChange={setAmount}
                        />
                    </div>

                    {/* Descripción */}
                    <NotesField
                        label="Descripción (opcional)"
                        value={description}
                        onChange={setDescription}
                        placeholder="Ej: Transferencia a cuenta bancaria"
                        rows={2}
                        required={false}
                    />
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                submitLabel="Registrar Transferencia"
                onCancel={onCancel}
            />
        </form>
    );
}
