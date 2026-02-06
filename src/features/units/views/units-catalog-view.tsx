"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ContentLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { ListItem } from "@/components/ui/list-item";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
    Plus,
    Ruler,
    MoreHorizontal,
    Pencil,
    Trash2,
    Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/stores/modal-store";
import { UnitForm, type Unit } from "../forms/unit-form";
import { UnitPresentationForm, type UnitPresentation } from "../forms/unit-presentation-form";
import { deleteUnit, deleteUnitPresentation } from "../actions";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/shared/forms/general/delete-dialog";

// ============================================================================
// Types
// ============================================================================

export interface UnitsCatalogViewProps {
    units: Unit[];
    presentations: UnitPresentation[];
    orgId: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function UnitsCatalogView({
    units,
    presentations,
    orgId,
}: UnitsCatalogViewProps) {
    const router = useRouter();
    const { openModal } = useModal();
    const [activeTab, setActiveTab] = useState<"units" | "presentations">("units");
    const [searchQuery, setSearchQuery] = useState("");

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: "unit" | "presentation"; item: Unit | UnitPresentation } | null>(null);

    // Filter data based on search
    const filteredUnits = useMemo(() => {
        if (!searchQuery.trim()) return units;
        const query = searchQuery.toLowerCase();
        return units.filter(
            (u) =>
                u.name.toLowerCase().includes(query) ||
                u.symbol?.toLowerCase().includes(query)
        );
    }, [units, searchQuery]);

    const filteredPresentations = useMemo(() => {
        if (!searchQuery.trim()) return presentations;
        const query = searchQuery.toLowerCase();
        return presentations.filter(
            (p) =>
                p.name.toLowerCase().includes(query) ||
                p.unit_name?.toLowerCase().includes(query)
        );
    }, [presentations, searchQuery]);

    // Check if item can be edited (only org items, not system)
    const canEditItem = (item: Unit | UnitPresentation) => !item.is_system;

    // ========================================================================
    // Unit Handlers
    // ========================================================================

    const handleCreateUnit = () => {
        openModal(
            <UnitForm organizationId={orgId} />,
            {
                title: "Nueva Unidad",
                description: "Crear una nueva unidad de medida",
                size: "md"
            }
        );
    };

    const handleEditUnit = (unit: Unit) => {
        if (!canEditItem(unit)) {
            toast.error("No podés editar unidades del sistema");
            return;
        }
        openModal(
            <UnitForm organizationId={orgId} initialData={unit} />,
            {
                title: "Editar Unidad",
                description: "Modificar los datos de esta unidad",
                size: "md"
            }
        );
    };

    const handleDeleteUnitClick = (unit: Unit) => {
        if (!canEditItem(unit)) {
            toast.error("No podés eliminar unidades del sistema");
            return;
        }
        setItemToDelete({ type: "unit", item: unit });
        setDeleteModalOpen(true);
    };

    // ========================================================================
    // Presentation Handlers
    // ========================================================================

    const handleCreatePresentation = () => {
        openModal(
            <UnitPresentationForm organizationId={orgId} units={units} />,
            {
                title: "Nueva Presentación",
                description: "Crear una nueva presentación de unidad",
                size: "md"
            }
        );
    };

    const handleEditPresentation = (presentation: UnitPresentation) => {
        if (!canEditItem(presentation)) {
            toast.error("No podés editar presentaciones del sistema");
            return;
        }
        openModal(
            <UnitPresentationForm
                organizationId={orgId}
                units={units}
                initialData={presentation}
            />,
            {
                title: "Editar Presentación",
                description: "Modificar los datos de esta presentación",
                size: "md"
            }
        );
    };

    const handleDeletePresentationClick = (presentation: UnitPresentation) => {
        if (!canEditItem(presentation)) {
            toast.error("No podés eliminar presentaciones del sistema");
            return;
        }
        setItemToDelete({ type: "presentation", item: presentation });
        setDeleteModalOpen(true);
    };

    // ========================================================================
    // Delete Confirmation
    // ========================================================================

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === "unit") {
                const result = await deleteUnit(itemToDelete.item.id);
                if (!result.success) {
                    toast.error(result.error || "Error al eliminar");
                    return;
                }
                toast.success("Unidad eliminada correctamente");
            } else {
                const result = await deleteUnitPresentation(itemToDelete.item.id);
                if (!result.success) {
                    toast.error(result.error || "Error al eliminar");
                    return;
                }
                toast.success("Presentación eliminada correctamente");
            }
            router.refresh();
        } catch (error) {
            toast.error("Error inesperado al eliminar");
        } finally {
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    const isUnitsTab = activeTab === "units";
    const currentItems = isUnitsTab ? filteredUnits : filteredPresentations;

    return (
        <>
            <ContentLayout variant="wide">
                {/* Toolbar with tabs in leftActions (like materials) */}
                <Toolbar
                    portalToHeader
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder={isUnitsTab
                        ? "Buscar unidades por nombre o símbolo..."
                        : "Buscar presentaciones por nombre o unidad..."
                    }
                    leftActions={
                        <ToolbarTabs
                            value={activeTab}
                            onValueChange={(v) => setActiveTab(v as "units" | "presentations")}
                            options={[
                                { label: "Unidades", value: "units", icon: Ruler },
                                { label: "Presentaciones", value: "presentations", icon: Package },
                            ]}
                        />
                    }
                    actions={[
                        {
                            label: isUnitsTab ? "Nueva Unidad" : "Nueva Presentación",
                            icon: Plus,
                            onClick: isUnitsTab ? handleCreateUnit : handleCreatePresentation,
                        },
                    ]}
                />

                {/* Items View */}
                <div className="h-full">
                    {currentItems.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <EmptyState
                                icon={isUnitsTab ? Ruler : Package}
                                title="Sin resultados"
                                description={searchQuery
                                    ? `No se encontraron ${isUnitsTab ? 'unidades' : 'presentaciones'} con ese criterio de búsqueda.`
                                    : `Agregá ${isUnitsTab ? 'unidades' : 'presentaciones'} para comenzar.`
                                }
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {isUnitsTab ? (
                                // Units List
                                filteredUnits.map((unit) => (
                                    <UnitCard
                                        key={unit.id}
                                        unit={unit}
                                        canEdit={canEditItem(unit)}
                                        onEdit={handleEditUnit}
                                        onDelete={handleDeleteUnitClick}
                                    />
                                ))
                            ) : (
                                // Presentations List
                                filteredPresentations.map((presentation) => (
                                    <PresentationCard
                                        key={presentation.id}
                                        presentation={presentation}
                                        canEdit={canEditItem(presentation)}
                                        onEdit={handleEditPresentation}
                                        onDelete={handleDeletePresentationClick}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </ContentLayout>

            {/* Delete Confirmation Dialog */}
            <DeleteDialog
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteModalOpen(false);
                        setItemToDelete(null);
                    }
                }}
                onConfirm={handleConfirmDelete}
                title={itemToDelete?.type === "unit" ? "Eliminar Unidad" : "Eliminar Presentación"}
                description={`¿Estás seguro de que querés eliminar "${itemToDelete?.type === "unit" ? (itemToDelete.item as Unit).name : (itemToDelete?.item as UnitPresentation)?.name}"? Esta acción no se puede deshacer.`}
            />
        </>
    );
}

// ============================================================================
// Unit Card Component (same pattern as MaterialCard)
// ============================================================================

interface UnitCardProps {
    unit: Unit;
    canEdit: boolean;
    onEdit: (unit: Unit) => void;
    onDelete: (unit: Unit) => void;
}

function UnitCard({ unit, canEdit, onEdit, onDelete }: UnitCardProps) {
    return (
        <ListItem variant="card">
            <ListItem.Content>
                <ListItem.Title suffix={unit.symbol ? `(${unit.symbol})` : undefined}>
                    {unit.name}
                </ListItem.Title>
                <ListItem.Badges>
                    <Badge variant="secondary" className="text-xs">
                        {unit.is_system ? 'Sistema' : 'Propio'}
                    </Badge>
                </ListItem.Badges>
            </ListItem.Content>

            {canEdit && (
                <ListItem.Actions>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Acciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(unit)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(unit)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ListItem.Actions>
            )}
        </ListItem>
    );
}

// ============================================================================
// Presentation Card Component (same pattern as MaterialCard)
// ============================================================================

interface PresentationCardProps {
    presentation: UnitPresentation;
    canEdit: boolean;
    onEdit: (p: UnitPresentation) => void;
    onDelete: (p: UnitPresentation) => void;
}

function PresentationCard({ presentation, canEdit, onEdit, onDelete }: PresentationCardProps) {
    return (
        <ListItem variant="card">
            <ListItem.Content>
                <ListItem.Title>
                    {presentation.name}
                </ListItem.Title>
                <ListItem.Badges>
                    <Badge variant="outline" className="text-xs font-medium">
                        {presentation.unit_name} × {presentation.equivalence}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                        {presentation.is_system ? 'Sistema' : 'Propio'}
                    </Badge>
                </ListItem.Badges>
            </ListItem.Content>

            {canEdit && (
                <ListItem.Actions>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Acciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(presentation)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(presentation)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ListItem.Actions>
            )}
        </ListItem>
    );
}
