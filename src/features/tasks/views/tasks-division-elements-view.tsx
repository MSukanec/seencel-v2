"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { CheckboxGrid } from "../components/checkbox-grid";
import { TasksElementForm } from "../forms";
import { toggleDivisionElement } from "../actions";
import { useModal } from "@/stores/modal-store";
import { TaskDivision, TaskElement, Unit } from "../types";

// ============================================================================
// Types
// ============================================================================

interface DivisionElementsViewProps {
    division: TaskDivision;
    allElements: TaskElement[];
    linkedElementIds: string[];
    units?: Unit[];
}

// ============================================================================
// Component
// ============================================================================

export function TasksDivisionElementsView({
    division,
    allElements,
    linkedElementIds,
    units = [],
}: DivisionElementsViewProps) {
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");

    // ========================================================================
    // Filtered elements
    // ========================================================================

    const filteredElements = useMemo(() => {
        if (!searchQuery.trim()) return allElements;
        const query = searchQuery.toLowerCase();
        return allElements.filter(e =>
            e.name.toLowerCase().includes(query) ||
            e.code?.toLowerCase().includes(query) ||
            e.description?.toLowerCase().includes(query)
        );
    }, [allElements, searchQuery]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleToggleElement = async (elementId: string, checked: boolean) => {
        return await toggleDivisionElement(division.id, elementId, checked);
    };

    const handleCreateElement = () => {
        openModal(<TasksElementForm units={units} onSuccess={closeModal} onCancel={closeModal} />, {
            title: "Nuevo Elemento",
            description: "Creá un nuevo elemento constructivo para el catálogo.",
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
                searchPlaceholder="Buscar elementos..."
                actions={[{
                    label: "Nuevo Elemento",
                    icon: Plus,
                    onClick: handleCreateElement,
                }]}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Elementos Compatibles</CardTitle>
                    <CardDescription>
                        Seleccioná qué elementos constructivos aplican al rubro "{division.name}".
                        Por ejemplo, el rubro "Mamposterías" incluye Muro, Tabique, etc.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CheckboxGrid
                        items={filteredElements.map(e => ({
                            id: e.id,
                            name: e.name,
                            code: e.code,
                            description: e.description
                        }))}
                        selectedIds={linkedElementIds}
                        onToggle={handleToggleElement}
                        columns={3}
                        showSearch={false}
                        emptyMessage="No hay elementos definidos"
                    />
                </CardContent>
            </Card>
        </>
    );
}
