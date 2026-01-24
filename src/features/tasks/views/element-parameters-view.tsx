"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { CheckboxGrid } from "../components/compatibility/checkbox-grid";
import { ParameterForm } from "../components/forms/parameter-form";
import { toggleElementParameter } from "../actions";
import { useModal } from "@/providers/modal-store";
import { TaskElement, TaskParameter } from "../types";

// ============================================================================
// Types
// ============================================================================

interface ElementParametersViewProps {
    element: TaskElement;
    allParameters: TaskParameter[];
    linkedParameterIds: string[];
}

// ============================================================================
// Component
// ============================================================================

export function ElementParametersView({
    element,
    allParameters,
    linkedParameterIds,
}: ElementParametersViewProps) {
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");

    // ========================================================================
    // Filtered parameters
    // ========================================================================

    const filteredParameters = useMemo(() => {
        if (!searchQuery.trim()) return allParameters;
        const query = searchQuery.toLowerCase();
        return allParameters.filter(p =>
            p.label.toLowerCase().includes(query) ||
            p.slug.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
        );
    }, [allParameters, searchQuery]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleToggleParameter = async (parameterId: string, checked: boolean) => {
        return await toggleElementParameter(element.id, parameterId, checked);
    };

    const handleCreateParameter = () => {
        openModal(<ParameterForm onSuccess={closeModal} onCancel={closeModal} />, {
            title: "Nuevo Parámetro",
            description: "Creá un nuevo parámetro configurable para tareas.",
            size: "md",
        });
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <>
            {/* Toolbar teleports to header */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar parámetros..."
                actions={[{
                    label: "Nuevo Parámetro",
                    icon: Plus,
                    onClick: handleCreateParameter,
                }]}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Parámetros del Elemento</CardTitle>
                    <CardDescription>
                        Seleccioná qué parámetros configurables aplican al elemento "{element.name}".
                        Por ejemplo, un Muro puede tener Espesor, Tipo de Ladrillo, Altura, etc.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CheckboxGrid
                        items={filteredParameters.map(p => ({
                            id: p.id,
                            name: p.label,
                            code: p.slug,
                            description: p.description
                        }))}
                        selectedIds={linkedParameterIds}
                        onToggle={handleToggleParameter}
                        columns={3}
                        showSearch={false}
                        emptyMessage="No hay parámetros definidos"
                    />
                </CardContent>
            </Card>
        </>
    );
}
