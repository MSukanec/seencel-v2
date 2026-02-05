"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Calendar, MoreHorizontal, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { useModal } from "@/stores/modal-store";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { IndexTypeForm } from "../components/forms/index-type-form";
import { IndexValuesView } from "./index-values-view";
import type { EconomicIndexType } from "../types";
import { PERIODICITY_LABELS, MONTH_NAMES } from "../types";
import { deleteIndexTypeAction } from "../actions";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdvancedIndicesViewProps {
    organizationId: string;
    indexTypes: EconomicIndexType[];
}

function IndexTypeCard({
    indexType,
    onSelect,
    onEdit,
    onDelete,
}: {
    indexType: EconomicIndexType;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const latestValue = indexType.latest_value;
    const mainComponent = indexType.components?.find(c => c.is_main);
    const mainValue = latestValue && mainComponent ? latestValue.values[mainComponent.key] : null;

    return (
        <div
            className="group relative border rounded-xl p-5 bg-card hover:border-primary/50 transition-all cursor-pointer"
            onClick={onSelect}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg truncate">{indexType.name}</h3>
                        {indexType.source && (
                            <span className="text-[10px] text-muted-foreground uppercase shrink-0">
                                {indexType.source}
                            </span>
                        )}
                    </div>
                    {indexType.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                            {indexType.description}
                        </p>
                    )}
                </div>

                {/* Dropdown Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={onEdit}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={onDelete}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="text-xs">
                    <Calendar className="mr-1 h-3 w-3" />
                    {PERIODICITY_LABELS[indexType.periodicity]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                    {indexType.components?.length || 0} componentes
                </Badge>
                <Badge variant="outline" className="text-xs">
                    {indexType.values_count || 0} registros
                </Badge>
            </div>

            {/* Latest Value */}
            {mainValue ? (
                <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                        <div className="text-2xl font-bold font-mono">
                            {mainValue.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {latestValue?.period_month && MONTH_NAMES[latestValue.period_month - 1]} {latestValue?.period_year}
                        </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
            ) : (
                <div className="flex items-center justify-between pt-3 border-t text-muted-foreground">
                    <span className="text-sm">Sin valores registrados</span>
                    <ChevronRight className="h-5 w-5" />
                </div>
            )}
        </div>
    );
}

export function AdvancedIndicesView({
    organizationId,
    indexTypes = [],
}: AdvancedIndicesViewProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [selectedIndexType, setSelectedIndexType] = useState<EconomicIndexType | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [indexToDelete, setIndexToDelete] = useState<EconomicIndexType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handlers
    const handleCreate = () => {
        openModal(
            <IndexTypeForm
                organizationId={organizationId}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
                onCancel={closeModal}
            />,
            {
                title: "Crear Índice",
                description: "Definí un nuevo tipo de índice económico con sus componentes.",
                size: "lg"
            }
        );
    };

    const handleEdit = (indexType: EconomicIndexType) => {
        openModal(
            <IndexTypeForm
                organizationId={organizationId}
                initialData={indexType}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
                onCancel={closeModal}
            />,
            {
                title: "Editar Índice",
                description: `Modificar configuración de ${indexType.name}`,
                size: "lg"
            }
        );
    };

    const handleDeleteClick = (indexType: EconomicIndexType) => {
        setIndexToDelete(indexType);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!indexToDelete) return;

        setIsDeleting(true);
        try {
            await deleteIndexTypeAction(indexToDelete.id);
            toast.success("Índice eliminado");
            router.refresh();
        } catch {
            toast.error("Error al eliminar");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setIndexToDelete(null);
        }
    };

    const handleSelect = (indexType: EconomicIndexType) => {
        setSelectedIndexType(indexType);
    };

    // If an index is selected, show its values
    if (selectedIndexType) {
        return (
            <IndexValuesView
                organizationId={organizationId}
                indexType={selectedIndexType}
                onBack={() => setSelectedIndexType(null)}
            />
        );
    }

    // Empty state
    if (indexTypes.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={[
                        {
                            label: "Crear Índice",
                            icon: Plus,
                            onClick: handleCreate,
                        }
                    ]}
                />
                <div className="h-full flex items-center justify-center min-h-[400px]">
                    <EmptyState
                        icon={TrendingUp}
                        title="Creá tu primer índice"
                        description="Los índices económicos (CAC, ICC, IPC) te permiten ajustar presupuestos y contratos según la inflación."
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <Toolbar
                    portalToHeader
                    actions={[
                        {
                            label: "Crear Índice",
                            icon: Plus,
                            onClick: handleCreate,
                        }
                    ]}
                />

                {/* Index Types Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {indexTypes.map((indexType) => (
                        <IndexTypeCard
                            key={indexType.id}
                            indexType={indexType}
                            onSelect={() => handleSelect(indexType)}
                            onEdit={() => handleEdit(indexType)}
                            onDelete={() => handleDeleteClick(indexType)}
                        />
                    ))}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar índice?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará <strong>"{indexToDelete?.name}"</strong> junto con todos sus {indexToDelete?.values_count || 0} registros de valores.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
