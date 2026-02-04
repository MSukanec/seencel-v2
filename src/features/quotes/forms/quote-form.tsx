"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createQuote, updateQuote, createChangeOrder } from "../actions";
import { QuoteView, QuoteType, QuoteStatus, QUOTE_TYPE_LABELS, QUOTE_STATUS_LABELS } from "../types";
import { OrganizationFinancialData } from "@/features/clients/types";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface QuoteFormProps {
    mode: "create" | "edit";
    initialData?: QuoteView;
    organizationId: string;
    financialData: OrganizationFinancialData;
    clients: { id: string; name: string }[];
    projects?: { id: string; name: string }[]; // Optional: not available in project context
    projectId?: string; // If provided, we're in project context (no project selector)
    onCancel?: () => void;
    onSuccess?: (quoteId?: string) => void;
    // New props for Change Orders
    parentQuoteId?: string;
    parentQuoteName?: string;
}

export function QuoteForm({
    mode,
    initialData,
    organizationId,
    financialData,
    clients,
    projects,
    projectId,
    onCancel,
    onSuccess,
    parentQuoteId,
    parentQuoteName
}: QuoteFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Is this a Change Order?
    const isChangeOrder = !!parentQuoteId || initialData?.quote_type === 'change_order';

    // Extract currencies from financialData
    const { currencies, defaultCurrencyId } = financialData;
    const hasMultipleCurrencies = currencies.length > 1;
    const t = useTranslations("FormHelp.quotes");

    /**
     * Parse a date string (YYYY-MM-DD) as LOCAL date, not UTC
     * This prevents the "off by one day" issue when displaying dates
     */
    const parseDateLocal = (dateStr: string): Date => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed
    };

    // Form states for controlled inputs
    const [quoteDate, setQuoteDate] = useState<Date | undefined>(
        initialData?.quote_date ? parseDateLocal(initialData.quote_date.split('T')[0]) : new Date()
    );
    const [validUntil, setValidUntil] = useState<Date | undefined>(
        initialData?.valid_until ? parseDateLocal(initialData.valid_until.split('T')[0]) : undefined
    );
    const [currencyId, setCurrencyId] = useState<string>(
        initialData?.currency_id || defaultCurrencyId || currencies[0]?.id || ""
    );
    const [exchangeRate, setExchangeRate] = useState<string>(
        initialData?.exchange_rate?.toString() || "1"
    );
    const [clientId, setClientId] = useState<string>(
        initialData?.client_id || ""
    );

    // Determine if exchange rate field should be shown (only if multiple currencies)
    const selectedCurrency = currencies.find((c: any) => c.id === currencyId);
    // Always allow editing exchange rate if there are multiple currencies
    const showExchangeRate = hasMultipleCurrencies;

    // Context: are we in project context?
    const isProjectContext = !!projectId;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading(mode === "create" ? "Creando..." : "Guardando cambios...");

        try {
            const formData = new FormData(e.currentTarget);

            // SPECIAL HANDLING FOR CHANGE ORDERS
            if (parentQuoteId && mode === "create") {
                const name = formData.get("name") as string;
                const description = formData.get("description") as string;

                const result = await createChangeOrder(parentQuoteId, { name, description });

                if (result.error) {
                    toast.error(result.error, { id: toastId });
                } else {
                    toast.success("¡Adicional creado!", { id: toastId });
                    onSuccess?.(result.data?.id);
                }

                setIsLoading(false);
                return;
            }

            // Dates are already in hidden input via DatePicker component
            // Currency/exchange needs manual set
            formData.set("currency_id", currencyId);
            formData.set("exchange_rate", exchangeRate);

            // If project context, set the project_id explicitly
            if (isProjectContext && projectId) {
                formData.set("project_id", projectId);
            } else {
                // Handle "none" value - convert to empty string for backend
                const projectIdValue = formData.get("project_id");
                if (projectIdValue === "none") {
                    formData.delete("project_id");
                }
            }

            if (mode === "edit" && initialData?.id) {
                formData.append("id", initialData.id);
            }

            const result = mode === "create"
                ? await createQuote(formData)
                : await updateQuote(formData);

            if (result.error) {
                toast.error(result.error, { id: toastId });
            } else {
                toast.success(mode === "create" ? "¡Presupuesto creado!" : "¡Cambios guardados!", { id: toastId });
                onSuccess?.(result.data?.id);
            }
        } catch (error: any) {
            console.error("Quote form error:", error);
            toast.error("Error inesperado: " + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <input type="hidden" name="organization_id" value={organizationId} />

            {/* Context Badge for Change Orders */}
            {parentQuoteId && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">Creando Adicional</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Este adicional estará vinculado al contrato <strong>{parentQuoteName}</strong>.
                            Heredará el cliente, proyecto, moneda y configuración de impuestos.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                    {parentQuoteId ? (
                        // SIMPLIFIED FORM FOR CHANGE ORDERS
                        <>
                            {/* Name (full width) */}
                            <div className="md:col-span-12">
                                <FormGroup label="Nombre del Adicional" htmlFor="name" required>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Ej: Adicional #1 - Cambio de pisos"
                                        // Auto-generate logic handled in backend if empty, but good to prompt user
                                        autoFocus
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Si lo dejas vacío, se generará como "CO #[N]: Adicional"
                                    </p>
                                </FormGroup>
                            </div>

                            {/* Description (full width) */}
                            <div className="md:col-span-12">
                                <FormGroup label="Descripción / Motivo del cambio" htmlFor="description">
                                    <Textarea
                                        id="description"
                                        name="description"
                                        placeholder="Describe por qué se realiza este adicional..."
                                        rows={4}
                                    />
                                </FormGroup>
                            </div>
                        </>
                    ) : (
                        // REGULAR FORM
                        <>

                            {/* Row 1: Fecha | Vencimiento */}
                            <div className="md:col-span-6">
                                <FormGroup label="Fecha del Presupuesto" htmlFor="quote_date" required>
                                    <DatePicker
                                        id="quote_date"
                                        name="quote_date"
                                        value={quoteDate}
                                        onChange={setQuoteDate}
                                        placeholder="Seleccionar fecha"
                                        required
                                    />
                                </FormGroup>
                            </div>
                            <div className="md:col-span-6">
                                <FormGroup label="Válido hasta" htmlFor="valid_until">
                                    <DatePicker
                                        id="valid_until"
                                        name="valid_until"
                                        value={validUntil}
                                        onChange={setValidUntil}
                                        placeholder="Sin vencimiento"
                                        minDate={quoteDate}
                                    />
                                </FormGroup>
                            </div>

                            {/* Row 2: Nombre (full width) */}
                            <div className="md:col-span-12">
                                <FormGroup label="Nombre del Presupuesto" htmlFor="name" required>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Ej: Presupuesto de construcción principal"
                                        defaultValue={initialData?.name || ""}
                                        required
                                        autoFocus
                                    />
                                </FormGroup>
                            </div>

                            {/* Row 3: Proyecto | Cliente */}
                            {!isProjectContext && projects && (
                                <div className="md:col-span-6">
                                    <FormGroup
                                        label="Proyecto"
                                        htmlFor="project_id"
                                        tooltip={t("project")}
                                    >
                                        <Select name="project_id" defaultValue={initialData?.project_id || "none"}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("projectEmpty")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    <span className="text-muted-foreground">{t("projectEmpty")}</span>
                                                </SelectItem>
                                                {projects.map((project) => (
                                                    <SelectItem key={project.id} value={project.id}>
                                                        {project.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormGroup>
                                </div>
                            )}

                            <div className={isProjectContext ? "md:col-span-12" : "md:col-span-6"}>
                                <FormGroup
                                    label="Cliente"
                                    htmlFor="client_id"
                                    tooltip={
                                        <span>
                                            {t("client")}{" "}
                                            <a href="/organization/contacts" target="_blank" rel="noopener noreferrer">
                                                {t("clientLink")}
                                            </a>
                                        </span>
                                    }
                                >
                                    <Combobox
                                        name="client_id"
                                        value={clientId}
                                        onValueChange={setClientId}
                                        placeholder="Seleccionar cliente"
                                        searchPlaceholder="Buscar cliente..."
                                        emptyMessage="No se encontraron clientes"
                                        options={clients.map((client) => ({
                                            value: client.id,
                                            label: client.name,
                                        }))}
                                    />
                                </FormGroup>
                            </div>

                            {/* Row 4: Estado (Half width, or full if preferred, leaving as 6 to keep grid tight) */}
                            <div className="md:col-span-6">
                                <FormGroup label="Estado" htmlFor="status" required>
                                    <Select name="status" defaultValue={initialData?.status || "draft"}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(Object.keys(QUOTE_STATUS_LABELS) as QuoteStatus[]).map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {QUOTE_STATUS_LABELS[status]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormGroup>
                            </div>

                            {/* Empty spacer if we want strict rows, or let Currency float up? 
                                User asked for "Estado" then "Moneda/Cotizacion". 
                                If I just close the div here, Currency will float next to Status. 
                                To force new line, I can wrap in fragments or just use col-span.
                                If I want Status ALONE on that row (visual break), I might need an empty div or use col-span-12 for Status.
                                But col-span-12 for a small select is ugly.
                                Let's assume flow: Dates(6,6) -> Name(12) -> Proj/Client(6,6) -> Status(6) [Empty(6)] -> Currency(6)/Exch(6).
                            */}
                            <div className="md:col-span-6 md:block hidden"></div>

                            {/* Row 5: Moneda | Cotización (only if multi) */}
                            {hasMultipleCurrencies && (
                                <>
                                    <div className="md:col-span-6">
                                        <FormGroup label="Moneda" htmlFor="currency_id" required>
                                            <Select value={currencyId} onValueChange={setCurrencyId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar moneda" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {currencies.map((currency: any) => (
                                                        <SelectItem key={currency.id} value={currency.id}>
                                                            {currency.symbol} - {currency.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormGroup>
                                    </div>
                                    <div className="md:col-span-6">
                                        <FormGroup label="Cotización" htmlFor="exchange_rate">
                                            <Input
                                                id="exchange_rate"
                                                name="exchange_rate"
                                                type="number"
                                                step="0.000001"
                                                min="0"
                                                placeholder="1.0"
                                                value={exchangeRate}
                                                onChange={(e) => setExchangeRate(e.target.value)}
                                                disabled={!showExchangeRate}
                                            />
                                        </FormGroup>
                                    </div>
                                </>
                            )}

                            {/* Row 6: Etiqueta (4) | Impuesto (4) | Descuento (4) */}
                            <div className="md:col-span-4">
                                <FormGroup label="Etiqueta impuesto" htmlFor="tax_label">
                                    <Select name="tax_label" defaultValue={initialData?.tax_label || financialData.defaultTaxLabel || "IVA"}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="IVA">IVA</SelectItem>
                                            <SelectItem value="VAT">VAT</SelectItem>
                                            <SelectItem value="Sales Tax">Sales Tax</SelectItem>
                                            <SelectItem value="GST">GST</SelectItem>
                                            <SelectItem value="ICMS">ICMS</SelectItem>
                                            <SelectItem value="Tax">Tax</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormGroup>
                            </div>
                            <div className="md:col-span-4">
                                <FormGroup label="Impuesto %" htmlFor="tax_pct">
                                    <Input
                                        id="tax_pct"
                                        name="tax_pct"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        placeholder="0"
                                        defaultValue={initialData?.tax_pct || 0}
                                    />
                                </FormGroup>
                            </div>
                            <div className="md:col-span-4">
                                <FormGroup label="Descuento %" htmlFor="discount_pct">
                                    <Input
                                        id="discount_pct"
                                        name="discount_pct"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        placeholder="0"
                                        defaultValue={initialData?.discount_pct || 0}
                                    />
                                </FormGroup>
                            </div>

                            {/* Row 7: Descripción (full width) */}
                            <div className="md:col-span-12">
                                <FormGroup label="Descripción" htmlFor="description">
                                    <Textarea
                                        id="description"
                                        name="description"
                                        placeholder="Describe brevemente el alcance de este presupuesto..."
                                        defaultValue={initialData?.description || ""}
                                        rows={3}
                                    />
                                </FormGroup>
                            </div>

                            {/* Hidden Input for Type */}
                            <input type="hidden" name="quote_type" value={mode === 'create' ? 'quote' : initialData?.quote_type} />

                            {/* Hidden: Version (auto-managed) */}
                            <input type="hidden" name="version" value={initialData?.version || 1} />

                        </>
                    )}
                </div>
            </div>

            <FormFooter
                onCancel={onCancel}
                cancelLabel="Cancelar"
                submitLabel={isLoading
                    ? (mode === "create" ? "Creando..." : "Guardando...")
                    : (mode === "create" ? "Crear Presupuesto" : "Guardar Cambios")
                }
                isLoading={isLoading}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}

