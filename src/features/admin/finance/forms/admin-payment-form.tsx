"use client";

// ============================================================
// ADMIN PAYMENT FORM  (Según SKILL seencel-forms-modals)
// ============================================================
// Semi-autónomo: maneja su propio ciclo de vida.
// No recibe onSuccess ni onCancel como props.
// Usa FormFooter con className obligatorio.
// Ubicación correcta: features/admin/finance/forms/
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useModal } from "@/stores/modal-store";

import { FormFooter } from "@/components/shared/forms/form-footer";
import { SelectField } from "@/components/shared/forms/fields/select-field";
import { AmountField } from "@/components/shared/forms/fields/amount-field";

import { createPayment, updatePayment, getAdminUsers, getAdminCurrencies } from "../actions";
import type { AdminPayment } from "../queries";

// ============================================================
// TIPOS
// ============================================================

interface AdminPaymentFormProps {
    initialData?: AdminPayment;
}

type PaymentStatus = "pending" | "completed" | "rejected" | "refunded";

// ============================================================
// OPCIONES ESTÁTICAS
// ============================================================

const PROVIDER_OPTIONS = [
    { value: "manual", label: "Manual" },
    { value: "paypal", label: "PayPal" },
    { value: "stripe", label: "Stripe" },
    { value: "mercadopago", label: "MercadoPago" },
    { value: "transfer", label: "Transferencia" },
];

const STATUS_OPTIONS = [
    { value: "pending", label: "Pendiente" },
    { value: "completed", label: "Completado" },
    { value: "rejected", label: "Rechazado" },
    { value: "refunded", label: "Reembolsado" },
];

// ============================================================
// COMPONENT
// ============================================================

export function AdminPaymentForm({ initialData }: AdminPaymentFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // ── State ─────────────────────────────────────────────
    const [provider, setProvider] = useState(initialData?.provider || "manual");
    const [userId, setUserId] = useState(initialData?.user_id || "");
    const [currency, setCurrency] = useState(initialData?.currency || "ARS");
    const [amount, setAmount] = useState<string>(String(initialData?.amount || ""));
    const [status, setStatus] = useState<PaymentStatus>((initialData?.status as PaymentStatus) || "completed");

    // ── Async data ────────────────────────────────────────
    const [users, setUsers] = useState<{ id: string; email: string; full_name: string | null }[]>([]);
    const [currencies, setCurrencies] = useState<{ id: string; code: string; name: string; symbol: string }[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        Promise.all([getAdminUsers(), getAdminCurrencies()]).then(([usersData, currenciesData]) => {
            setUsers(usersData);
            setCurrencies(currenciesData);
            setLoadingData(false);
        });
    }, []);

    // ── Callbacks internos ────────────────────────────────
    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        closeModal();
    };

    // ── Submit ─────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isEditing && !userId) {
            toast.error("Seleccioná un usuario");
            return;
        }
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
            toast.error("Ingresá un monto válido");
            return;
        }

        setIsLoading(true);
        try {
            if (isEditing) {
                await updatePayment({
                    id: initialData.id,
                    provider,
                    amount: parsedAmount,
                    currency,
                    status,
                });
                toast.success("Pago actualizado");
            } else {
                await createPayment({
                    provider,
                    user_id: userId,
                    amount: parsedAmount,
                    currency,
                    status,
                });
                toast.success("Pago creado");
            }
            handleSuccess();
        } catch {
            toast.error(isEditing ? "Error al actualizar pago" : "Error al crear pago");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Build options ─────────────────────────────────────

    const userOptions = users.map((u) => ({
        value: u.id,
        label: u.full_name || u.email,
        searchTerms: `${u.full_name ?? ""} ${u.email}`,
    }));

    const renderUserOption = (option: { value: string; label: string; searchTerms?: string }) => {
        const user = users.find((u) => u.id === option.value);
        return (
            <div className="flex flex-col">
                <span className="text-sm">{option.label}</span>
                {user?.email && (
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                )}
            </div>
        );
    };

    // Currencies: value = currency.code (payments table stores code, not UUID)
    const currencyOptions = currencies.map((c) => ({
        value: c.code,
        label: `${c.code} — ${c.name} (${c.symbol})`,
    }));

    // ── Render ─────────────────────────────────────────────
    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto space-y-4 px-1">

                {/* Proveedor */}
                <SelectField
                    label="Proveedor"
                    options={PROVIDER_OPTIONS}
                    value={provider}
                    onChange={setProvider}
                    required
                />

                {/* Usuario (solo al crear) */}
                {!isEditing && (
                    <SelectField
                        label="Usuario"
                        options={userOptions}
                        value={userId}
                        onChange={setUserId}
                        required
                        searchable
                        searchPlaceholder="Buscar por nombre o email..."
                        loading={loadingData}
                        renderOption={renderUserOption}
                        emptyState={{ message: "No hay usuarios registrados." }}
                    />
                )}

                {/* Moneda + Monto */}
                <div className="grid grid-cols-2 gap-4">
                    <SelectField
                        label="Moneda"
                        options={currencyOptions}
                        value={currency}
                        onChange={setCurrency}
                        required
                        loading={loadingData}
                    />

                    <AmountField
                        label="Monto"
                        value={amount}
                        onChange={setAmount}
                        required
                    />
                </div>

                {/* Estado */}
                <SelectField
                    label="Estado"
                    options={STATUS_OPTIONS}
                    value={status}
                    onChange={(v) => setStatus(v as PaymentStatus)}
                    required
                />
            </div>

            {/* Footer sticky */}
            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear"}
                onCancel={handleCancel}
            />
        </form>
    );
}
