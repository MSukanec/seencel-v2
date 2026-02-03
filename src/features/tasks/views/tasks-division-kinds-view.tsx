"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { CheckboxGrid } from "../components/checkbox-grid";
import { toggleDivisionKind } from "../actions";
import { TaskDivision, TaskKind } from "../types";

// ============================================================================
// Types
// ============================================================================

interface DivisionKindsViewProps {
    division: TaskDivision;
    allKinds: TaskKind[];
    linkedKindIds: string[];
}

// ============================================================================
// Component
// ============================================================================

export function TasksDivisionKindsView({
    division,
    allKinds,
    linkedKindIds,
}: DivisionKindsViewProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // ========================================================================
    // Filtered kinds
    // ========================================================================

    const filteredKinds = useMemo(() => {
        if (!searchQuery.trim()) return allKinds;
        const query = searchQuery.toLowerCase();
        return allKinds.filter(k =>
            k.name.toLowerCase().includes(query) ||
            k.short_code?.toLowerCase().includes(query) ||
            k.description?.toLowerCase().includes(query)
        );
    }, [allKinds, searchQuery]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleToggleKind = async (kindId: string, checked: boolean) => {
        return await toggleDivisionKind(division.id, kindId, checked);
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
                        items={filteredKinds.map(k => ({
                            id: k.id,
                            name: k.name,
                            code: k.short_code || k.code,
                            description: k.description
                        }))}
                        selectedIds={linkedKindIds}
                        onToggle={handleToggleKind}
                        columns={2}
                        showSearch={false}
                        emptyMessage="No hay tipos de acción definidos"
                    />
                </CardContent>
            </Card>
        </>
    );
}
