"use client";

/**
 * General Costs — Concept Form (Panel)
 * Hybrid Chip Form — Linear-inspired
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │ Header (icon + title)           │
 * ├─────────────────────────────────┤
 * │ Chips (category, recurrence)    │
 * │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
 * │ Hero: Name (big, bg accent)     │
 * │                                 │
 * │ Description (borderless)        │
 * │ Expected amount (if recurring)  │
 * ├─────────────────────────────────┤
 * │ Footer (cancel + submit)        │
 * └─────────────────────────────────┘
 */

import { useState, useEffect, useMemo } from "react";
import { usePanel } from "@/stores/panel-store";
import { FileText, FolderOpen, Repeat } from "lucide-react";
import { toast } from "sonner";
import {
    ChipRow,
    SelectChip,
} from "@/components/shared/chips";
import { useFormData } from "@/stores/organization-store";
import { FormTextField } from "@/components/shared/forms/fields/form-text-field";
import { GeneralCost, GeneralCostCategory } from "@/features/general-costs/types";
import { createGeneralCost, updateGeneralCost, createGeneralCostCategory } from "@/features/general-costs/actions";

// ─── Types ───────────────────────────────────────────────

interface ConceptFormProps {
    organizationId: string;
    categories: GeneralCostCategory[];
    initialData?: GeneralCost | null;
    onSuccess?: () => void;
    formId?: string;
}

// ─── Constants ───────────────────────────────────────────

const RECURRENCE_OPTIONS = [
    { value: "none", label: "Sin recurrencia", icon: <Repeat className="h-3.5 w-3.5 text-muted-foreground/50" /> },
    { value: "monthly", label: "Mensual", icon: <Repeat className="h-3.5 w-3.5 text-muted-foreground" /> },
    { value: "weekly", label: "Semanal", icon: <Repeat className="h-3.5 w-3.5 text-muted-foreground" /> },
    { value: "quarterly", label: "Trimestral", icon: <Repeat className="h-3.5 w-3.5 text-muted-foreground" /> },
    { value: "yearly", label: "Anual", icon: <Repeat className="h-3.5 w-3.5 text-muted-foreground" /> },
];

/** Format amount with thousand separators for display (AR format: 150.000,50) */
function formatAmountDisplay(raw: string): string {
    const [integer, decimal] = raw.split(".");
    const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return decimal !== undefined ? `${formatted},${decimal}` : formatted;
}

// ─── Component ───────────────────────────────────────────

export function GeneralCostsConceptForm({
    organizationId,
    categories,
    initialData,
    onSuccess,
    formId,
}: ConceptFormProps) {
    const { closePanel, setPanelMeta, completePanel } = usePanel();
    const isEditing = !!initialData;

    // Local copy of categories (for optimistic inline creation)
    const [localCategories, setLocalCategories] = useState(categories);

    // Form state
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [categoryId, setCategoryId] = useState(initialData?.category_id || "");
    const [recurrenceInterval, setRecurrenceInterval] = useState(
        initialData?.is_recurring ? (initialData.recurrence_interval || "monthly") : "none"
    );
    const [expectedDay, setExpectedDay] = useState(String(initialData?.expected_day || "1"));
    const [expectedAmount, setExpectedAmount] = useState(initialData?.expected_amount?.toString() || "");
    const [expectedCurrencyId, setExpectedCurrencyId] = useState(initialData?.expected_currency_id || "");

    // Derived
    const isRecurring = recurrenceInterval !== "none";

    // Currencies from org store
    const { currencies } = useFormData();

    // Set default currency if not set
    useEffect(() => {
        if (!expectedCurrencyId && currencies.length > 0) {
            const defaultCurrency = currencies.find(c => c.is_default) || currencies[0];
            if (defaultCurrency) setExpectedCurrencyId(defaultCurrency.id);
        }
    }, [currencies, expectedCurrencyId]);

    // ─── Panel Meta ──────────────────────────────────────
    useEffect(() => {
        setPanelMeta({
            icon: FileText,
            title: isEditing ? "Editar Concepto" : "Nuevo Concepto",
            description: isEditing
                ? "Modificá los datos del concepto de gasto."
                : "Definí un concepto de gasto (ej. Alquiler, Luz, Internet).",
            size: "md",
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : "Crear Concepto",
            },
        });
    }, [isEditing, setPanelMeta]);

    // ─── Chip options ────────────────────────────────────
    const categoryChipOptions = useMemo(() =>
        (localCategories ?? []).map((cat) => ({
            value: cat.id,
            label: cat.name,
            icon: <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />,
        })),
        [localCategories]
    );

    // Inline category creation
    const handleCreateCategory = async (name: string): Promise<string | undefined> => {
        try {
            const newCat = await createGeneralCostCategory({
                organization_id: organizationId,
                name,
            });
            if (newCat?.id) {
                // Add to local categories optimistically
                setLocalCategories(prev => [...prev, newCat as GeneralCostCategory]);
                toast.success(`Categoría "${name}" creada`);
                return newCat.id;
            }
        } catch {
            toast.error("Error al crear la categoría");
        }
        return undefined;
    };

    const selectedCurrency = currencies?.find(c => c.id === expectedCurrencyId);
    const currencySymbol = selectedCurrency?.symbol || "$";

    // Reset form for "create another"
    const resetForm = () => {
        setName("");
        setDescription("");
        setExpectedAmount("");
        setExpectedDay("1");
    };

    // ─── Submit ──────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }
        if (!categoryId) {
            toast.error("La categoría es obligatoria");
            return;
        }

        try {
            const payload = {
                name,
                description: description || undefined,
                category_id: categoryId,
                is_recurring: isRecurring,
                recurrence_interval: isRecurring ? recurrenceInterval : undefined,
                expected_day: isRecurring ? Number(expectedDay) || undefined : undefined,
                expected_amount: isRecurring && expectedAmount ? parseFloat(expectedAmount) : null,
                expected_currency_id: isRecurring && expectedCurrencyId ? expectedCurrencyId : null,
            };

            if (isEditing && initialData) {
                updateGeneralCost(initialData.id, payload);
                toast.success("Concepto actualizado");
            } else {
                createGeneralCost({
                    ...payload,
                    organization_id: organizationId,
                });
                toast.success("Concepto creado");
            }
            onSuccess?.();

            if (isEditing) {
                closePanel();
            } else {
                completePanel(resetForm);
            }
        } catch {
            toast.error("Error al guardar el concepto");
        }
    };

    // ─── Render ──────────────────────────────────────────
    return (
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col flex-1">
            {/* ── Chips: Metadata ───────────────────────── */}
            <ChipRow>
                <SelectChip
                    value={categoryId}
                    onChange={setCategoryId}
                    options={categoryChipOptions}
                    icon={<FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />}
                    emptyLabel="Categoría"
                    searchPlaceholder="Buscar categoría..."
                    popoverWidth={220}
                    onCreateNew={handleCreateCategory}
                    createLabel="Crear categoría"
                />
                <SelectChip
                    value={recurrenceInterval}
                    onChange={setRecurrenceInterval}
                    options={RECURRENCE_OPTIONS}
                    icon={<Repeat className="h-3.5 w-3.5 text-muted-foreground" />}
                    emptyLabel="Recurrencia"
                    searchPlaceholder="Buscar..."
                    popoverWidth={200}
                />
            </ChipRow>

            {/* ── Hero: Name ────────────────────────────── */}
            <FormTextField
                variant="hero"
                value={name}
                onChange={setName}
                placeholder="Nombre del concepto..."
                autoFocus
            />

            {/* ── Borderless fields ─────────────────────── */}
            <div className="flex-1 mt-4 space-y-1">
                {/* Description */}
                <FormTextField
                    variant="body"
                    value={description}
                    onChange={setDescription}
                    placeholder="Agregar descripción o notas..."
                />

                {/* Recurring details — only when recurring is active */}
                {isRecurring && (
                    <div className="border-t border-border/10 pt-3 mt-2 space-y-3">
                        {/* Expected day */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground select-none w-28 shrink-0">Día esperado</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={expectedDay}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, "");
                                    if (v === "" || (Number(v) >= 1 && Number(v) <= 31)) setExpectedDay(v);
                                }}
                                placeholder="1-31"
                                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 outline-none border-none font-mono"
                            />
                        </div>
                        {/* Expected amount */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground select-none w-28 shrink-0">Monto esperado</span>
                            <div className="flex items-center gap-1.5 flex-1">
                                <span className="text-sm text-muted-foreground select-none">{currencySymbol}</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={expectedAmount ? formatAmountDisplay(expectedAmount) : ""}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\./g, "").replace(",", ".");
                                        if (raw === "" || /^\d*\.?\d*$/.test(raw)) setExpectedAmount(raw);
                                    }}
                                    placeholder="0"
                                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 outline-none border-none font-mono"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </form>
    );
}
