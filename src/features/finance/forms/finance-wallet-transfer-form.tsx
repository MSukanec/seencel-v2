"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ArrowRightLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { useModal } from "@/stores/modal-store";
import { useFormData } from "@/stores/organization-store";

import { cn } from "@/lib/utils";
import { formatDateForDB } from "@/lib/timezone-data";
import { createWalletTransfer } from "@/features/finance/actions";

interface WalletTransferFormProps {
    organizationId?: string; // Optional - falls back to store
    projectId?: string;
    wallets?: { id: string; wallet_name: string; currency_code?: string }[]; // Optional - falls back to store
    currencies?: { id: string; name: string; code: string; symbol: string }[]; // Optional - falls back to store
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
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);

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

        setIsLoading(true);

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
                throw new Error(result.error || "Error al registrar transferencia");
            }

            toast.success("Transferencia registrada");
            onSuccess?.();
            closeModal();
        } catch (error: any) {
            console.error("Error creating wallet transfer:", error);
            toast.error(error.message || "Error al registrar transferencia");
        } finally {
            setIsLoading(false);
        }
    };

    const selectedCurrency = currencies.find(c => c.id === currencyId);
    const fromWallet = wallets.find(w => w.id === fromWalletId);
    const toWallet = wallets.find(w => w.id === toWalletId);

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    {/* Date */}
                    <FormGroup label="Fecha de Operación" required>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !operationDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {operationDate
                                        ? format(operationDate, "d 'de' MMMM 'de' yyyy", { locale: es })
                                        : "Seleccionar fecha"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={operationDate}
                                    onSelect={(date) => date && setOperationDate(date)}
                                    initialFocus
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </FormGroup>

                    {/* Wallets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormGroup label="Billetera Origen" required>
                            <Select value={fromWalletId} onValueChange={setFromWalletId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar billetera" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wallets.map((wallet) => (
                                        <SelectItem key={wallet.id} value={wallet.id}>
                                            {wallet.wallet_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>

                        <FormGroup label="Billetera Destino" required>
                            <Select value={toWalletId} onValueChange={setToWalletId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar billetera" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wallets.map((wallet) => (
                                        <SelectItem key={wallet.id} value={wallet.id}>
                                            {wallet.wallet_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    </div>

                    {/* Visual indicator */}
                    {fromWallet && toWallet && fromWalletId !== toWalletId && (
                        <div className="flex items-center justify-center gap-3 py-2 px-4 rounded-lg bg-muted/50">
                            <span className="text-sm font-medium">{fromWallet.wallet_name}</span>
                            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{toWallet.wallet_name}</span>
                        </div>
                    )}

                    {/* Currency and Amount */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormGroup label="Moneda" required>
                            <Select value={currencyId} onValueChange={setCurrencyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar moneda" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map((curr) => (
                                        <SelectItem key={curr.id} value={curr.id}>
                                            {curr.name} ({curr.symbol})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>

                        <FormGroup label="Monto" required>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {selectedCurrency?.symbol || "$"}
                                </span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="pl-8"
                                />
                            </div>
                        </FormGroup>
                    </div>

                    {/* Description */}
                    <FormGroup label="Descripción (opcional)">
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: Transferencia a cuenta bancaria"
                            rows={2}
                        />
                    </FormGroup>
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel="Registrar Transferencia"
                onCancel={onCancel || closeModal}
            />
        </form>
    );
}
