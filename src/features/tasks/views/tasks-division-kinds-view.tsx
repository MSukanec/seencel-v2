"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { CheckboxGrid } from "../components/checkbox-grid";
import { toggleDivisionAction } from "../actions";
import { TaskDivision, TaskAction } from "../types";

// ============================================================================
// Types
// ============================================================================

interface DivisionActionsViewProps {
    division: TaskDivision;
    allActions: TaskAction[];
    linkedActionIds: string[];
}

// ============================================================================
// Component
// ============================================================================

export function TasksDivisionActionsView({
    division,
    allActions,
    linkedActionIds,
}: DivisionActionsViewProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // ========================================================================
    // Filtered kinds
    // ========================================================================

    const filteredActions = useMemo(() => {
        if (!searchQuery.trim()) return allActions;
        const query = searchQuery.toLowerCase();
        return allActions.filter(k =>
            k.name.toLowerCase().includes(query) ||
            k.short_code?.toLowerCase().includes(query) ||
            k.description?.toLowerCase().includes(query)
        );
    }, [allActions, searchQuery]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleToggleAction = async (actionId: string, checked: boolean) => {
        return await toggleDivisionAction(division.id, actionId, checked);
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
                searchPlaceholder="Buscar tipos de acción..."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Tipos de Acción Compatibles</CardTitle>
                    <CardDescription>
                        Seleccioná qué tipos de acción aplican al rubro "{division.name}".
                        Por ejemplo, "Mamposterías" puede incluir Ejecución, Reparación, Demolición.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CheckboxGrid
                        items={filteredActions.map(k => ({
                            id: k.id,
                            name: k.name,
                            code: k.short_code,
                            description: k.description
                        }))}
                        selectedIds={linkedActionIds}
                        onToggle={handleToggleAction}
                        columns={2}
                        showSearch={false}
                        emptyMessage="No hay tipos de acción definidos"
                    />
                </CardContent>
            </Card>
        </>
    );
}
