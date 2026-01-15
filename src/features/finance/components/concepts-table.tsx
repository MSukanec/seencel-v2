"use client";

import { useState, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { GeneralCost, GeneralCostCategory } from "@/types/general-costs";
import { deleteGeneralCost } from "@/actions/general-costs";
import { ConceptFormDialog } from "./concept-form-dialog";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";

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

interface ConceptsTableProps {
    data: GeneralCost[];
    categories: GeneralCostCategory[];
    organizationId: string;
}

export function ConceptsTable({ data, categories, organizationId }: ConceptsTableProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedConcept, setSelectedConcept] = useState<GeneralCost | undefined>(undefined);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [conceptToDelete, setConceptToDelete] = useState<GeneralCost | null>(null);
    const [isDeleting, startDeleteTransition] = useTransition();

    const handleCreate = () => {
        setSelectedConcept(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (concept: GeneralCost) => {
        setSelectedConcept(concept);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (concept: GeneralCost) => {
        setConceptToDelete(concept);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!conceptToDelete) return;

        startDeleteTransition(async () => {
            try {
                await deleteGeneralCost(conceptToDelete.id);
                toast.success("Concepto eliminado");
                setIsDeleteDialogOpen(false);
            } catch (error) {
                console.error(error);
                toast.error("Error al eliminar el concepto");
            }
        });
    };

    const columns: ColumnDef<GeneralCost>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
            cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
        },
        {
            id: "category",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Categoría" />,
            accessorFn: (row) => row.category?.name,
            cell: ({ row }) => {
                const category = row.original.category;
                return category ? (
                    <Badge variant="outline">{category.name}</Badge>
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
        {
            accessorKey: "is_recurring",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Recurrencia" />,
            cell: ({ row }) => {
                const cost = row.original;
                return cost.is_recurring ? (
                    <Badge variant="secondary">
                        {cost.recurrence_interval === 'monthly' ? 'Mensual' : cost.recurrence_interval}
                        {cost.expected_day ? ` (Día ${cost.expected_day})` : ''}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">Único</span>
                );
            },
        },
        {
            accessorKey: "description",
            header: "Descripción",
            cell: ({ row }) => (
                <span className="text-muted-foreground truncate max-w-[200px] block">
                    {row.getValue("description") || "-"}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Conceptos de Gasto</h3>
                    <p className="text-sm text-muted-foreground">Define los tipos de gastos recurrentes o eventuales.</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Concepto
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Conceptos</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={data}
                        searchPlaceholder="Buscar conceptos..."
                        showToolbar={true}
                        showPagination={true}
                        pageSize={10}
                        enableRowActions={true}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                    />
                </CardContent>
            </Card>

            <ConceptFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                conceptToEdit={selectedConcept}
                categories={categories}
                organizationId={organizationId}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el concepto
                            <strong> {conceptToDelete?.name}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault(); // Prevent auto-close
                                confirmDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

