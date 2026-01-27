"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createIndexValueAction, updateIndexValueAction } from "@/features/advanced/actions";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import type { EconomicIndexType, EconomicIndexValue } from "@/features/advanced/types";
import { MONTH_NAMES, QUARTER_NAMES } from "@/features/advanced/types";

interface IndexValueFormProps {
    indexType: EconomicIndexType;
    initialData?: EconomicIndexValue | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
}));

const MONTHS = MONTH_NAMES.map((name, i) => ({
    value: String(i + 1),
    label: name,
}));

const QUARTERS = QUARTER_NAMES.map((name, i) => ({
    value: String(i + 1),
    label: `${name} (${['Ene-Mar', 'Abr-Jun', 'Jul-Sep', 'Oct-Dic'][i]})`,
}));

export function IndexValueForm({
    indexType,
    initialData,
    onSuccess,
    onCancel,
}: IndexValueFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    const components = indexType.components || [];

    // Period state
    const [year, setYear] = useState(initialData?.period_year?.toString() || String(currentYear));
    const [month, setMonth] = useState(initialData?.period_month?.toString() || String(new Date().getMonth() + 1));
    const [quarter, setQuarter] = useState(initialData?.period_quarter?.toString() || "1");

    // Values state - dynamic based on components
    const [values, setValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        components.forEach(comp => {
            initial[comp.key] = initialData?.values[comp.key]?.toString() || "";
        });
        return initial;
    });

    const [sourceUrl, setSourceUrl] = useState(initialData?.source_url || "");
    const [notes, setNotes] = useState(initialData?.notes || "");

    const handleValueChange = (key: string, value: string) => {
        setValues(prev => ({ ...prev, [key]: value }));
    };

    const parseNumber = (val: string): number | undefined => {
        if (!val || val.trim() === '') return undefined;
        const num = Number(val.replace(',', '.'));
        return isNaN(num) ? undefined : num;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Convert string values to numbers
        const numericValues: Record<string, number> = {};
        for (const comp of components) {
            const num = parseNumber(values[comp.key]);
            if (num !== undefined) {
                numericValues[comp.key] = num;
            }
        }

        // Validate at least main component has value
        const mainComponent = components.find(c => c.is_main);
        if (mainComponent && !numericValues[mainComponent.key]) {
            toast.error(`El valor de "${mainComponent.name}" es obligatorio`);
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                index_type_id: indexType.id,
                period_year: parseInt(year),
                period_month: indexType.periodicity === 'monthly' ? parseInt(month) : null,
                period_quarter: indexType.periodicity === 'quarterly' ? parseInt(quarter) : null,
                values: numericValues,
                source_url: sourceUrl.trim() || undefined,
                notes: notes.trim() || undefined,
            };

            if (isEditing && initialData) {
                await updateIndexValueAction(initialData.id, payload);
                toast.success("Valor actualizado");
            } else {
                await createIndexValueAction(payload);
                toast.success("Valor registrado");
            }
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-6">
                    {/* Period Selection */}
                    <div className={`grid gap-4 ${indexType.periodicity === 'annual' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <FormGroup label="Año">
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {YEARS.map((y) => (
                                        <SelectItem key={y.value} value={y.value}>
                                            {y.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>

                        {indexType.periodicity === 'monthly' && (
                            <FormGroup label="Mes">
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormGroup>
                        )}

                        {indexType.periodicity === 'quarterly' && (
                            <FormGroup label="Trimestre">
                                <Select value={quarter} onValueChange={setQuarter}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {QUARTERS.map((q) => (
                                            <SelectItem key={q.value} value={q.value}>
                                                {q.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormGroup>
                        )}
                    </div>

                    {/* Component Values */}
                    <div className="space-y-3">
                        <div className="text-sm font-medium">Valores</div>
                        <div className="grid grid-cols-2 gap-4">
                            {components.map(comp => (
                                <FormGroup
                                    key={comp.id}
                                    label={comp.name}
                                    required={comp.is_main}
                                >
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder={comp.is_main ? "Obligatorio" : "Opcional"}
                                        className="font-mono"
                                        value={values[comp.key] || ""}
                                        onChange={(e) => handleValueChange(comp.key, e.target.value)}
                                    />
                                </FormGroup>
                            ))}
                        </div>
                    </div>

                    {/* Optional metadata */}
                    <div className="space-y-4 pt-4 border-t">
                        <FormGroup label="URL de Fuente" helpText="Link al informe oficial (opcional)">
                            <Input
                                type="url"
                                placeholder="https://..."
                                value={sourceUrl}
                                onChange={(e) => setSourceUrl(e.target.value)}
                            />
                        </FormGroup>

                        <FormGroup label="Notas">
                            <Input
                                placeholder="Notas adicionales..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </FormGroup>
                    </div>
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar" : "Registrar"}
                onCancel={onCancel}
            />
        </form>
    );
}
