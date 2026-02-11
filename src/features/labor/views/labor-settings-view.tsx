"use client";

import { useState, useMemo } from "react";
import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/stores/modal-store";
import { DeleteDialog } from "@/components/shared/forms/general/delete-dialog";
import {
    Plus,
    Tags,
    Pencil,
    Trash2,
    ShieldCheck
} from "lucide-react";
import { LaborCategory } from "../types";
import { LaborCategoryForm } from "../forms/labor-category-form";
import { deleteLaborCategory } from "../actions";
import { toast } from "sonner";

interface LaborSettingsViewProps {
    projectId: string;
    orgId: string;
    laborTypes: LaborCategory[];
}

export function LaborSettingsView({
    projectId,
    orgId,
    laborTypes,
}: LaborSettingsViewProps) {
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<LaborCategory | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter categories by search
    const filteredCategories = useMemo(() => {
        if (!searchQuery) return laborTypes;
        const query = searchQuery.toLowerCase();
        return laborTypes.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.description?.toLowerCase().includes(query)
        );
    }, [laborTypes, searchQuery]);

    // Separate system and org categories
    const systemCategories = filteredCategories.filter(c => c.is_system);
    const orgCategories = filteredCategories.filter(c => !c.is_system);

    const handleOpenForm = (category?: LaborCategory) => {
        openModal(
            <LaborCategoryForm
                initialData={category}
                organizationId={orgId}
                onSuccess={closeModal}
                onCancel={closeModal}
            />,
            {
                title: category ? "Editar Categoría" : "Nueva Categoría",
                description: category
                    ? "Modificá los datos de la categoría de trabajo."
                    : "Creá una nueva categoría para clasificar a tus trabajadores.",
                size: "md",
            }
        );
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            const result = await deleteLaborCategory(deleteTarget.id);
            if (result.success) {
                toast.success("Categoría eliminada", {
                    description: `"${deleteTarget.name}" se eliminó correctamente.`,
                });
            } else {
                toast.error("Error al eliminar", {
                    description: result.error,
                });
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            toast.error("Error inesperado");
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    const toolbarActions = [
        {
            label: "Nueva Categoría",
            icon: Plus,
            onClick: () => handleOpenForm(),
        },
    ];

    const renderCategoryRow = (category: LaborCategory) => (
        <div
            key={category.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-medium">{category.name}</h4>
                    {category.is_system && (
                        <Badge variant="secondary" className="text-xs gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Sistema
                        </Badge>
                    )}
                </div>
                {category.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                    </p>
                )}
            </div>
            {/* Solo mostrar botones de editar/eliminar para categorías de la org */}
            {!category.is_system && (
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenForm(category)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(category)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <>
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar categorías..."
                actions={toolbarActions}
            />

            <ContentLayout variant="wide" className="pb-6">
                <div className="space-y-6">
                    {/* Org Categories Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tags className="h-5 w-5" />
                                Categorías de tu Empresa
                            </CardTitle>
                            <CardDescription>
                                Categorías personalizadas de tu organización
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {orgCategories.length === 0 ? (
                                <ViewEmptyState
                                    mode="empty"
                                    icon={Tags}
                                    viewName="Categorías Personalizadas"
                                    featureDescription="Creá categorías específicas para tu empresa (ej: Capataz, Electricista, Plomero)."
                                    onAction={() => handleOpenForm()}
                                    actionLabel="Crear Categoría"
                                />
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {orgCategories.map(renderCategoryRow)}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* System Categories Section */}
                    {systemCategories.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5" />
                                    Categorías del Sistema
                                </CardTitle>
                                <CardDescription>
                                    Categorías predefinidas disponibles para todas las organizaciones
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    {systemCategories.map(renderCategoryRow)}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </ContentLayout>

            {/* Delete Confirmation Dialog */}
            <DeleteDialog
                open={!!deleteTarget}
                onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
                title="Eliminar Categoría"
                description={`¿Estás seguro de eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
            />
        </>
    );
}

