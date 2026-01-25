"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CategoryTree, CategoryItem } from "@/components/shared/category-tree";
import { DeleteReplacementModal } from "@/components/shared/forms/general/delete-replacement-modal";
import { DivisionForm } from "../components/forms/division-form";
import { deleteTaskDivision } from "../actions";
import { TaskDivision } from "@/features/tasks/types";
import { useModal } from "@/providers/modal-store";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";

// ============================================================================
// Types
// ============================================================================

interface DivisionsCatalogViewProps {
    divisions: TaskDivision[];
    isAdminMode?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function DivisionsCatalogView({
    divisions,
    isAdminMode = false,
}: DivisionsCatalogViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [divisionToDelete, setDivisionToDelete] = useState<TaskDivision | null>(null);

    // Filter divisions by search query
    const filteredDivisions = useMemo(() => {
        if (!searchQuery.trim()) return divisions;
        const query = searchQuery.toLowerCase();
        return divisions.filter(d =>
            d.name.toLowerCase().includes(query) ||
            (d.description && d.description.toLowerCase().includes(query))
        );
    }, [divisions, searchQuery]);

    // Transform divisions to CategoryItem format
    const items: CategoryItem[] = filteredDivisions.map(d => ({
        id: d.id,
        name: d.name,
        parent_id: d.parent_id ?? null,
        order: d.order ?? null
    }));

    // Get replacement options (all divisions except the one being deleted)
    const replacementOptions = useMemo(() => {
        if (!divisionToDelete) return [];
        return divisions
            .filter(d => d.id !== divisionToDelete.id)
            .map(d => ({ id: d.id, name: d.name }));
    }, [divisions, divisionToDelete]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleCreateClick = (parentId: string | null = null) => {
        if (!isAdminMode) {
            toast.info("Solo administradores pueden crear rubros");
            return;
        }

        // Find parent if specified
        const parentDivision = parentId ? divisions.find(d => d.id === parentId) : null;

        openModal(
            <DivisionForm
                divisions={divisions}
                initialData={parentId ? { parent_id: parentId } as any : null}
                onSuccess={closeModal}
                onCancel={closeModal}
            />,
            {
                title: parentDivision
                    ? `Crear Sub-rubro de "${parentDivision.name}"`
                    : "Crear Rubro",
                description: "Completá los campos para crear un nuevo rubro.",
                size: "md"
            }
        );
    };

    const handleEditClick = (item: CategoryItem) => {
        if (!isAdminMode) {
            toast.info("Solo administradores pueden editar rubros");
            return;
        }

        const division = divisions.find(d => d.id === item.id);
        if (!division) return;

        openModal(
            <DivisionForm
                initialData={division}
                divisions={divisions}
                onSuccess={closeModal}
                onCancel={closeModal}
            />,
            {
                title: "Editar Rubro",
                description: `Modificando "${division.name}"`,
                size: "md"
            }
        );
    };

    const handleDeleteClick = (item: CategoryItem) => {
        if (!isAdminMode) {
            toast.info("Solo administradores pueden eliminar rubros");
            return;
        }

        const division = divisions.find(d => d.id === item.id);
        if (division) {
            setDivisionToDelete(division);
            setDeleteModalOpen(true);
        }
    };

    const handleConfirmDelete = async (replacementId: string | null) => {
        if (!divisionToDelete) return;

        const result = await deleteTaskDivision(divisionToDelete.id, replacementId);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(
                replacementId
                    ? "Rubro eliminado y tareas reasignadas"
                    : "Rubro eliminado"
            );
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <>
            {/* Toolbar with portal to header */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar rubros por nombre o descripción..."
                actions={isAdminMode ? [{
                    label: "Nuevo Rubro",
                    icon: Plus,
                    onClick: () => handleCreateClick(null),
                }] : []}
            />

            {/* Category Tree */}
            <CategoryTree
                items={items}
                onAddClick={handleCreateClick}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                onItemClick={(item) => router.push(`/admin/catalog/division/${item.id}`)}
                emptyMessage={searchQuery ? "No se encontraron rubros" : "No hay rubros definidos"}
                showNumbering={true}
            />

            {/* Delete Modal with Replacement */}
            <DeleteReplacementModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDivisionToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                itemToDelete={divisionToDelete ? { id: divisionToDelete.id, name: divisionToDelete.name } : null}
                replacementOptions={replacementOptions}
                entityLabel="rubro"
                title="Eliminar Rubro"
                description={`Estás a punto de eliminar "${divisionToDelete?.name}". ¿Qué deseas hacer con las tareas asociadas?`}
            />
        </>
    );
}
