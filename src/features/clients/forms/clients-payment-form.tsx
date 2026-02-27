"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { usePanel } from "@/stores/panel-store";
import { toast } from "sonner";
import { Banknote } from "lucide-react";
import { FormGroup } from "@/components/ui/form-group";
import { formatDateForDB, parseDateFromDB } from "@/lib/timezone-data";
import { createPaymentAction, updatePaymentAction, getCommitmentsByClientAction } from "@/features/clients/actions";
import { MultiFileUpload, type UploadedFile, type MultiFileUploadRef } from "@/components/shared/multi-file-upload";
import { OrganizationFinancialData } from "../types";

// Form Field Factories - Standard 19.10
import {
    DateField,
    ProjectField,
    WalletField,
    CurrencyField,
    AmountField,
    ExchangeRateField,
    NotesField,
    ReferenceField,
    SelectField,
    ContactField,
} from "@/components/shared/forms/fields";

interface ClientsPaymentFormProps {
    projectId?: string;
    organizationId: string;
    clients: any[];
    financialData: OrganizationFinancialData;
    initialData?: any;
    onSuccess?: () => void;
    projects?: { id: string; name: string }[];
    showProjectSelector?: boolean;
    formId?: string; // ← from PanelProvider
}

export function ClientsPaymentForm({
    projectId: externalProjectId,
    organizationId,
    clients,
    financialData,
    initialData,
    onSuccess,
    projects = [],
    showProjectSelector = false,
    formId,
}: ClientsPaymentFormProps) {
    const { closePanel, setPanelMeta } = usePanel();
    const [isLoading, setIsLoading] = useState(false);
    const uploadRef = useRef<MultiFileUploadRef>(null);

    const { wallets, currencies, defaultWalletId, defaultCurrencyId } = financialData;

    // Form State
    const [date, setDate] = useState<Date | undefined>(
        initialData?.payment_date ? parseDateFromDB(initialData.payment_date) ?? new Date() : new Date()
    );
    const [clientId, setClientId] = useState(initialData?.client_id || "");
    const [walletId, setWalletId] = useState(initialData?.wallet_id || defaultWalletId || "");
    const [amount, setAmount] = useState(initialData?.amount || "");
    const [currencyId, setCurrencyId] = useState(initialData?.currency_id || defaultCurrencyId || "");
    const [exchangeRate, setExchangeRate] = useState(initialData?.exchange_rate || "");
    const [status, setStatus] = useState(initialData?.status || "confirmed");
    const [notes, setNotes] = useState(initialData?.notes || "");
    const [reference, setReference] = useState(initialData?.reference || "");
    const [commitmentId, setCommitmentId] = useState(initialData?.commitment_id || "");
    const [commitments, setCommitments] = useState<any[]>([]);
    const [loadingCommitments, setLoadingCommitments] = useState(false);

    // Project state for organization context
    const [selectedProjectId, setSelectedProjectId] = useState(externalProjectId || initialData?.project_id || "");
    const projectId = externalProjectId || selectedProjectId;

    // Filter clients by selected project
    const filteredClients = useMemo(() => {
        if (!projectId) return [];
        return clients.filter((c: any) => c.project_id === projectId);
    }, [clients, projectId]);

    // Reset client when project changes
    useEffect(() => {
        if (showProjectSelector) {
            setClientId("");
            setCommitmentId("");
        }
    }, [selectedProjectId, showProjectSelector]);

    // File Upload State
    const [files, setFiles] = useState<UploadedFile[]>(
        (initialData?.attachments && initialData.attachments.length > 0)
            ? initialData.attachments.map((att: any) => ({
                id: att.id || `existing-${Math.random()}`,
                url: att.url,
                name: att.name || 'Adjunto',
                type: att.mime || 'application/octet-stream',
                size: att.size || 0,
                path: '',
                bucket: ''
            }))
            : initialData?.image_url ? [{
                id: 'existing-legacy',
                url: initialData.image_url,
                name: initialData.media_name || 'Comprobante adjunto',
                type: initialData.media_mime || 'application/octet-stream',
                size: initialData.media_size || 0,
                path: '',
                bucket: ''
            }] : []
    );

    // Track if this is the initial load for commitments (to preserve initialData.commitment_id)
    const isInitialCommitmentLoad = useRef(true);

    useEffect(() => {
        if (clientId) {
            setLoadingCommitments(true);
            getCommitmentsByClientAction(clientId)
                .then(data => {
                    setCommitments(data);
                    // On initial load in edit mode, preserve the original commitmentId
                    if (isInitialCommitmentLoad.current && initialData?.commitment_id) {
                        isInitialCommitmentLoad.current = false;
                        setCommitmentId(initialData.commitment_id);
                    } else if (data && data.length > 0) {
                        const sorted = [...data].sort((a, b) => {
                            const dateA = new Date(a.created_at || 0).getTime();
                            const dateB = new Date(b.created_at || 0).getTime();
                            return dateB - dateA;
                        });
                        setCommitmentId(sorted[0].id);
                    } else {
                        setCommitmentId("");
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoadingCommitments(false));
        } else {
            setCommitments([]);
            setCommitmentId("");
        }
    }, [clientId]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate project when selector is shown
        if (showProjectSelector && !projectId) {
            toast.error("Seleccioná un proyecto");
            return;
        }

        setIsLoading(true);

        try {
            let finalFiles = files;
            if (uploadRef.current) {
                const uploaded = await uploadRef.current.startUpload();
                if (uploaded) finalFiles = uploaded;
            }

            const formData = new FormData();
            formData.append('project_id', projectId);
            formData.append('organization_id', organizationId);
            formData.append('payment_date', formatDateForDB(date) || formatDateForDB(new Date())!);
            formData.append('client_id', clientId);
            formData.append('wallet_id', walletId);
            formData.append('amount', amount);
            formData.append('currency_id', currencyId);
            formData.append('exchange_rate', exchangeRate);
            formData.append('status', status);
            if (notes) formData.append('notes', notes);
            if (reference) formData.append('reference', reference);
            if (commitmentId) formData.append('commitment_id', commitmentId);

            const selectedCurrency = currencies.find((c: any) => c.id === currencyId);
            if (selectedCurrency?.code) {
                formData.append('currency_code', selectedCurrency.code);
            }

            if (finalFiles && finalFiles.length > 0) {
                formData.append('media_files', JSON.stringify(finalFiles));
            }

            if (initialData?.id) {
                formData.append('id', initialData.id);
                await updatePaymentAction(formData as any);
                toast.success("Pago actualizado correctamente");
            } else {
                await createPaymentAction(formData as any);
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

    const isEditing = !!initialData?.id;

    // 🚨 Panel self-description
    useEffect(() => {
        setPanelMeta({
            icon: Banknote,
            title: isEditing ? "Editar Pago" : "Nuevo Pago de Cliente",
            description: isEditing
                ? "Modificá los detalles del pago."
                : "Registrá un nuevo pago para esta organización.",
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : "Registrar Pago",
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing]);

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
                {/* Project Selector - only shown when in organization context */}
                {showProjectSelector && (
                    <div className="mb-4">
                        <ProjectField
                            value={selectedProjectId}
                            onChange={setSelectedProjectId}
                            projects={projects}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fecha de Pago */}
                    <DateField
                        value={date}
                        onChange={setDate}
                        label="Fecha de Pago"
                    />

                    {/* Estado */}
                    <SelectField
                        label="Estado"
                        required
                        value={status}
                        onChange={setStatus}
                        options={[
                            { value: "confirmed", label: "Confirmado" },
                            { value: "pending", label: "Pendiente" },
                            { value: "rejected", label: "Rechazado" },
                            { value: "void", label: "Anulado" },
                        ]}
                    />

                    {/* Cliente */}
                    <ContactField
                        label="Cliente"
                        required
                        value={clientId}
                        onChange={setClientId}
                        disabled={showProjectSelector && !projectId}
                        placeholder={showProjectSelector && !projectId ? "Seleccioná un proyecto primero" : "Seleccionar cliente"}
                        searchPlaceholder="Buscar cliente..."
                        emptyMessage="No se encontró el cliente."
                        allowNone={false}
                        contacts={filteredClients.map((client) => ({
                            id: client.id,
                            name: client.contact_full_name || "Cliente sin nombre",
                            avatar_url: client.contact_avatar_url || null,
                            company_name: client.contact_company_name || null,
                        }))}
                    />

                    {/* Compromiso */}
                    <SelectField
                        label="Compromiso"
                        value={commitmentId || "none"}
                        onChange={(v) => setCommitmentId(v === "none" ? "" : v)}
                        disabled={!clientId || loadingCommitments}
                        loading={loadingCommitments}
                        placeholder={
                            !clientId
                                ? "Seleccioná un cliente primero"
                                : "Seleccionar compromiso"
                        }
                        options={[
                            { value: "none", label: "Sin compromiso" },
                            ...commitments.map((c: any) => ({
                                value: c.id,
                                label: `${c.concept || c.unit_description || c.unit_name || "Compromiso"} - ${c.currency?.symbol || ""}${c.amount}`,
                            })),
                        ]}
                    />

                    {/* Billetera */}
                    <WalletField
                        value={walletId}
                        onChange={setWalletId}
                        wallets={wallets}
                    />

                    {/* Monto */}
                    <AmountField
                        value={amount}
                        onChange={setAmount}
                    />

                    {/* Moneda */}
                    <CurrencyField
                        value={currencyId}
                        onChange={setCurrencyId}
                        currencies={currencies}
                    />

                    {/* Tipo de Cambio */}
                    <ExchangeRateField
                        value={exchangeRate}
                        onChange={setExchangeRate}
                    />

                    {/* Notas */}
                    <NotesField
                        value={notes}
                        onChange={setNotes}
                        placeholder="Agregar notas adicionales sobre el pago..."
                        className="md:col-span-2"
                    />

                    {/* Referencia + Comprobante - Stacked */}
                    <div className="md:col-span-2 grid grid-cols-1 gap-4">
                        {/* Referencia */}
                        <ReferenceField
                            value={reference}
                            onChange={setReference}
                        />

                        {/* Comprobante */}
                        <FormGroup label="Comprobante" helpText="Adjuntar imagen o PDF">
                            <MultiFileUpload
                                ref={uploadRef}
                                folderPath={`organizations/${organizationId}/finance/client-payments`}
                                onUploadComplete={setFiles}
                                initialFiles={files}
                                autoUpload={false}
                                maxSizeMB={5}
                                className="w-full"
                            />
                        </FormGroup>
                    </div>
                </div>
            </div>

        </form>
    );
}

// Re-export con nombre viejo para compatibilidad
export { ClientsPaymentForm as PaymentForm };
