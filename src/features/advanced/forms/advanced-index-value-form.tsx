"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { createIndexValueAction, updateIndexValueAction } from "@/features/advanced/actions";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { SelectField, NotesField, TextField } from "@/components/shared/forms/fields";
import { FormGroup } from "@/components/ui/form-group";
import type { EconomicIndexType, EconomicIndexValue } from "@/features/advanced/types";
import { MONTH_NAMES, QUARTER_NAMES } from "@/features/advanced/types";

interface AdvancedIndexValueFormProps {
    indexType: EconomicIndexType;
    initialData?: EconomicIndexValue | null;
}

const currentYear = new Date().getFullYear();

const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
}));

const MONTH_OPTIONS = MONTH_NAMES.map((name, i) => ({
    value: String(i + 1),
    label: name,
}));

const QUARTER_OPTIONS = QUARTER_NAMES.map((name, i) => ({
    value: String(i + 1),
    label: `${name} (${['Ene-Mar', 'Abr-Jun', 'Jul-Sep', 'Oct-Dic'][i]})`,
}));

export function AdvancedIndexValueForm({
    indexType,
    initialData,
}: AdvancedIndexValueFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // Callbacks internos (semi-autónomo)
    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        closeModal();
    };

    const components = indexType.components || [];

    // Period state
    const [year, setYear] = useState(initialData?.period_year?.toString() || String(currentYear));
    const [month, setMonth] = useState(initialData?.period_month?.toString() || String(new Date().getMonth() + 1));
    const [quarter, setQuarter] = useState(initialData?.period_quarter?.toString() || "1");

    // Values state — dynamic based on components
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

        // Validate main component has value
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
            handleSuccess();
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
                <div className="space-y-4">
                    {/* Period Selection */}
                    <div className={`grid gap-4 ${indexType.periodicity === 'annual' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <SelectField
                            label="Año"
                            value={year}
                            onChange={setYear}
                            options={YEAR_OPTIONS}
                            required
                        />

                        {indexType.periodicity === 'monthly' && (
                            <SelectField
                                label="Mes"
                                value={month}
                                onChange={setMonth}
                                options={MONTH_OPTIONS}
                                required
                            />
                        )}

                        {indexType.periodicity === 'quarterly' && (
                            <SelectField
                                label="Trimestre"
                                value={quarter}
                                onChange={setQuarter}
                                options={QUARTER_OPTIONS}
                                required
                            />
                        )}
                    </div>

                    {/* Component Values */}
                    <div className="space-y-3">
                        <FormGroup
                            label="Valores"
                            required={false}
                            tooltip="Ingresá los valores numéricos publicados para cada componente del índice en el período seleccionado. El componente principal es obligatorio y se usará como referencia para cálculos de ajuste y variación porcentual."
                        >
                            <div className="grid grid-cols-1 gap-4">
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
                        </FormGroup>
                    </div>

                    {/* Optional metadata */}
                    <div className="space-y-4 pt-4 border-t">
                        <TextField
                            label="URL de Fuente"
                            value={sourceUrl}
                            onChange={setSourceUrl}
                            placeholder="https://..."
                            type="url"
                            required={false}
                        />

                        <NotesField
                            value={notes}
                            onChange={setNotes}
                        />
                    </div>
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar" : "Registrar"}
                onCancel={handleCancel}
            />
        </form>
    );
}
