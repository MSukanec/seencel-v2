"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, TrendingUp, TrendingDown, Minus, Calendar, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { useModal } from "@/providers/modal-store";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { IndexValueForm } from "../components/forms/index-value-form";
import { getIndexValues } from "../queries";
import { deleteIndexValueAction } from "../actions";
import { toast } from "sonner";
import type { EconomicIndexType, EconomicIndexValue } from "../types";
import { MONTH_NAMES, QUARTER_NAMES } from "../types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";

interface IndexValuesViewProps {
    organizationId: string;
    indexType: EconomicIndexType;
    onBack: () => void;
}

function calculateVariation(current: number | undefined, previous: number | undefined): number | null {
    if (!current || !previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
}

function VariationBadge({ variation }: { variation: number | null }) {
    if (variation === null) return <span className="text-muted-foreground text-xs">—</span>;

    const isPositive = variation > 0;
    const isNeutral = Math.abs(variation) < 0.01;

    return (
        <div className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded",
            isPositive && "text-amber-600 bg-amber-100 dark:bg-amber-900/20",
            !isPositive && !isNeutral && "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20",
            isNeutral && "text-muted-foreground bg-muted"
        )}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> :
                isNeutral ? <Minus className="h-3 w-3" /> :
                    <TrendingDown className="h-3 w-3" />}
            {variation > 0 ? "+" : ""}{variation.toFixed(1)}%
        </div>
    );
}

function formatPeriod(value: EconomicIndexValue, periodicity: string): string {
    if (periodicity === 'monthly' && value.period_month) {
        return `${MONTH_NAMES[value.period_month - 1]} ${value.period_year}`;
    }
    if (periodicity === 'quarterly' && value.period_quarter) {
        return `${QUARTER_NAMES[value.period_quarter - 1]} ${value.period_year}`;
    }
    return String(value.period_year);
}

export function IndexValuesView({
    organizationId,
    indexType,
    onBack,
}: IndexValuesViewProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [values, setValues] = useState<EconomicIndexValue[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const components = indexType.components || [];
    const mainComponent = components.find(c => c.is_main);

    useEffect(() => {
        async function fetchValues() {
            setIsLoading(true);
            const data = await getIndexValues(indexType.id);
            setValues(data);
            setIsLoading(false);
        }
        fetchValues();
    }, [indexType.id]);

    const handleAddValue = () => {
        openModal(
            <IndexValueForm
                indexType={indexType}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                    // Refetch values
                    getIndexValues(indexType.id).then(setValues);
                }}
                onCancel={closeModal}
            />,
            {
                title: "Agregar Valor",
                description: `Registrar nuevo valor para ${indexType.name}`,
                size: "md"
            }
        );
    };

    const handleEditValue = (value: EconomicIndexValue) => {
        openModal(
            <IndexValueForm
                indexType={indexType}
                initialData={value}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                    getIndexValues(indexType.id).then(setValues);
                }}
                onCancel={closeModal}
            />,
            {
                title: "Editar Valor",
                description: formatPeriod(value, indexType.periodicity),
                size: "md"
            }
        );
    };

    const handleDeleteValue = async (value: EconomicIndexValue) => {
        if (!confirm(`¿Eliminar el registro de ${formatPeriod(value, indexType.periodicity)}?`)) return;

        try {
            await deleteIndexValueAction(value.id);
            toast.success("Valor eliminado");
            getIndexValues(indexType.id).then(setValues);
        } catch {
            toast.error("Error al eliminar");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-muted-foreground">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Toolbar
                portalToHeader
                leftActions={
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                }
                actions={[
                    {
                        label: "Agregar Valor",
                        icon: Plus,
                        onClick: handleAddValue,
                    }
                ]}
            />

            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b">
                <div>
                    <h2 className="text-2xl font-bold">{indexType.name}</h2>
                    {indexType.description && (
                        <p className="text-muted-foreground">{indexType.description}</p>
                    )}
                </div>
                <Badge variant="secondary">
                    {indexType.source || 'Manual'}
                </Badge>
            </div>

            {values.length === 0 ? (
                <div className="h-full flex items-center justify-center min-h-[300px]">
                    <EmptyState
                        icon={Calendar}
                        title="Sin valores registrados"
                        description={`Agregá el primer valor para ${indexType.name}`}
                    />
                </div>
            ) : (
                /* Values Table */
                <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-sm">Período</th>
                                    {components.map(comp => (
                                        <th key={comp.id} className="text-right px-4 py-3 font-medium text-sm">
                                            {comp.name}
                                            {comp.is_main && <Badge variant="outline" className="ml-2 text-[10px]">Principal</Badge>}
                                        </th>
                                    ))}
                                    <th className="text-right px-4 py-3 font-medium text-sm">Var %</th>
                                    <th className="w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {values.map((value, index) => {
                                    const previousValue = values[index + 1];
                                    const mainKey = mainComponent?.key || 'general';
                                    const variation = calculateVariation(
                                        value.values[mainKey],
                                        previousValue?.values[mainKey]
                                    );

                                    return (
                                        <tr key={value.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {formatPeriod(value, indexType.periodicity)}
                                                    </span>
                                                </div>
                                            </td>
                                            {components.map(comp => (
                                                <td key={comp.id} className="text-right px-4 py-3 font-mono">
                                                    {value.values[comp.key]?.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '—'}
                                                </td>
                                            ))}
                                            <td className="text-right px-4 py-3">
                                                <VariationBadge variation={variation} />
                                            </td>
                                            <td className="px-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEditValue(value)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteValue(value)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
