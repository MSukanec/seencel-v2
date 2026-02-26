"use client";

import { useState, useEffect } from "react";
import { usePanel } from "@/stores/panel-store";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";

import {
    DateField,
    SelectField,
    WalletField,
    AmountField,
    CurrencyField,
    ExchangeRateField,
    NotesField,
    ReferenceField,
    UploadField,
} from "@/components/shared/forms/fields";
import type { UploadedFile } from "@/hooks/use-file-upload";

import { formatDateForDB, parseDateFromDB } from "@/lib/timezone-data";
import { createMaterialPaymentAction, updateMaterialPaymentAction } from "@/features/materials/actions";
import { OrganizationFinancialData, MaterialPurchase, MaterialType } from "@/features/materials/types";

interface MaterialPaymentFormProps {
    projectId?: string;
    organizationId: string;
    purchases: MaterialPurchase[];
    materialTypes: MaterialType[];
    financialData: OrganizationFinancialData;
    initialData?: any;
    onSuccess?: () => void;
    formId?: string;
}

export function MaterialPaymentForm({
    projectId,
    organizationId,
    purchases,
    materialTypes,
    financialData,
    initialData,
    onSuccess,
    formId
}: MaterialPaymentFormProps) {
    const { closePanel, setPanelMeta } = usePanel();
    const [isLoading, setIsLoading] = useState(false);

    const isEditing = !!initialData?.id;

    // 🚨 Self-describe (SKILL: seencel-panel-forms)
    useEffect(() => {
        setPanelMeta({
            icon: CreditCard,
            title: isEditing ? "Editar Pago de Material" : "Nuevo Pago de Material",
            description: isEditing
                ? "Modifica los detalles del pago."
                : "Registra un nuevo pago por materiales.",
            size: "lg",
            footer: {
                submitLabel: isEditing ? "Actualizar Pago" : "Registrar Pago"
            }
        });
    }, [isEditing, setPanelMeta]);

    const { wallets, currencies, defaultWalletId, defaultCurrencyId } = financialData;

    // ========================================
    // FORM STATE
    // ========================================

    // Según dates-and-timezones.md: SIEMPRE usar parseDateFromDB()
    const [date, setDate] = useState<Date | undefined>(
        parseDateFromDB(initialData?.payment_date) ?? new Date()
    );
    const [purchaseId, setPurchaseId] = useState(initialData?.purchase_id || "");
    const [walletId, setWalletId] = useState(initialData?.wallet_id || defaultWalletId || "");
    const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
    const [currencyId, setCurrencyId] = useState(initialData?.currency_id || defaultCurrencyId || "");
    const [exchangeRate, setExchangeRate] = useState(initialData?.exchange_rate?.toString() || "");
    const [status, setStatus] = useState(initialData?.status || "confirmed");
    const [notes, setNotes] = useState(initialData?.notes || "");
    const [reference, setReference] = useState(initialData?.reference || "");
    const [materialTypeId, setMaterialTypeId] = useState(initialData?.material_type_id || "");

    // File Upload State — UploadField auto-uploads, files are already UploadedFile[]
    const [files, setFiles] = useState<UploadedFile[]>(() => {
        if (initialData?.attachments && initialData.attachments.length > 0) {
            return initialData.attachments.map((att: any) => ({
                id: att.id || `existing-${Math.random()}`,
                url: att.url,
                name: att.name || 'Adjunto',
                type: att.mime || 'application/octet-stream',
                size: att.size || 0,
                path: att.path || '',
                bucket: att.bucket || 'private-assets'
            }));
        }
        if (initialData?.image_url) {
            return [{
                id: 'existing-legacy',
                url: initialData.image_url,
                name: initialData.media_name || 'Comprobante adjunto',
                type: initialData.media_mime || 'application/octet-stream',
                size: initialData.media_size || 0,
                path: '',
                bucket: 'private-assets'
            }];
        }
        return [];
    });

    // Auto-select currency when wallet changes
    useEffect(() => {
        if (walletId) {
            const wallet = wallets.find((w: any) => w.id === walletId);
            if (wallet?.currency_code) {
                const matchingCurrency = currencies.find((c: any) => c.code === wallet.currency_code);
                if (matchingCurrency) {
                    setCurrencyId(matchingCurrency.id);
                }
            }
        }
    }, [walletId, wallets, currencies]);

    // ========================================
    // SUBMIT
    // ========================================

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('project_id', projectId || "");
            formData.append('organization_id', organizationId);
            formData.append('payment_date', formatDateForDB(date) || formatDateForDB(new Date())!);
            formData.append('purchase_id', purchaseId);
            formData.append('wallet_id', walletId);
            formData.append('amount', amount);
            formData.append('currency_id', currencyId);
            formData.append('exchange_rate', exchangeRate);
            formData.append('status', status);
            if (notes) formData.append('notes', notes);
            if (reference) formData.append('reference', reference);
            if (materialTypeId) formData.append('material_type_id', materialTypeId);

            // Pass currency_code directly
            const selectedCurrency = currencies.find((c: any) => c.id === currencyId);
            if (selectedCurrency?.code) {
                formData.append('currency_code', selectedCurrency.code);
            }

            // Files already uploaded by UploadField — just pass JSON
            if (files && files.length > 0) {
                formData.append('media_files', JSON.stringify(files));
            }

            if (initialData?.id) {
                formData.append('id', initialData.id);
                await updateMaterialPaymentAction(formData as any);
                toast.success("Pago actualizado correctamente");
            } else {
                await createMaterialPaymentAction(formData as any);
                toast.success("Pago registrado correctamente");
            }
            if (onSuccess) onSuccess();
            closePanel();

        } catch (error: any) {
            console.error("Error submitting payment:", error);
            toast.error(error.message || "Error al registrar pago");
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================
    // SELECT OPTIONS
    // ========================================

    const purchaseOptions = [
        { value: "__none__", label: "Sin vincular" },
        ...purchases.map((p) => ({
            value: p.id,
            label: p.reference || p.concept || "Compra sin referencia",
        })),
    ];

    const materialTypeOptions = [
        { value: "__none__", label: "Sin tipo" },
        ...materialTypes.map((t) => ({
            value: t.id,
            label: t.name,
        })),
    ];

    const statusOptions = [
        { value: "confirmed", label: "Confirmado" },
        { value: "pending", label: "Pendiente" },
        { value: "rejected", label: "Rechazado" },
        { value: "void", label: "Anulado" },
    ];

    // ========================================
    // RENDER
    // ========================================

    return (
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col h-full w-full min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4">
                {/* Row 1: Date & Purchase */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DateField
                        label="Fecha de Pago"
                        value={date}
                        onChange={setDate}
                        required
                    />

                    <SelectField
                        label="Orden de Compra"
                        value={purchaseId || "__none__"}
                        onChange={(val) => setPurchaseId(val === "__none__" ? "" : val)}
                        options={purchaseOptions}
                        placeholder="Seleccionar compra (opcional)"
                    />
                </div>

                {/* Row 1.5: Material Type */}
                <SelectField
                    label="Tipo de Material"
                    value={materialTypeId || "__none__"}
                    onChange={(val) => setMaterialTypeId(val === "__none__" ? "" : val)}
                    options={materialTypeOptions}
                    placeholder="Seleccionar tipo (opcional)"
                />

                {/* Row 2: Wallet & Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <WalletField
                        value={walletId}
                        onChange={setWalletId}
                        wallets={wallets}
                        required
                    />

                    <AmountField
                        value={amount}
                        onChange={setAmount}
                        required
                    />
                </div>

                {/* Row 3: Currency & Exchange Rate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CurrencyField
                        value={currencyId}
                        onChange={setCurrencyId}
                        currencies={currencies}
                        required
                    />

                    <ExchangeRateField
                        value={exchangeRate}
                        onChange={setExchangeRate}
                    />
                </div>

                {/* Row 4: Status */}
                <SelectField
                    label="Estado"
                    value={status}
                    onChange={setStatus}
                    options={statusOptions}
                    required
                />

                {/* Notes */}
                <NotesField
                    value={notes}
                    onChange={setNotes}
                    placeholder="Agregar notas adicionales sobre el pago..."
                />

                {/* Reference */}
                <ReferenceField
                    value={reference}
                    onChange={setReference}
                />

                {/* File Upload (Receipt) — UploadField auto-uploads on drop */}
                <UploadField
                    label="Comprobante"
                    mode="gallery"
                    value={files}
                    onChange={(val) => setFiles(val as UploadedFile[])}
                    folderPath={`organizations/${organizationId}/finance/material-payments`}
                    maxSizeMB={5}
                />

            </div>
        </form>
    );
}
