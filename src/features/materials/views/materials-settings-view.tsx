"use client";

import { useState, useTransition } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, Monitor, Building2 } from "lucide-react";
import { toast } from "sonner";

import { MaterialType } from "@/features/materials/types";
import { deleteMaterialType } from "@/features/materials/actions";
import { MaterialTypeFormDialog } from "../forms/material-type-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentLayout } from "@/components/layout";
import { useModal } from "@/providers/modal-store";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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

interface MaterialsSettingsViewProps {
    materialTypes: MaterialType[];
    organizationId: string;
}

export function MaterialsSettingsView({ materialTypes, organizationId }: MaterialsSettingsViewProps) {
    const { openModal, closeModal } = useModal();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<MaterialType | null>(null);
    const [isDeleting, startDeleteTransition] = useTransition();

    const handleCreate = () => {
        openModal(
            <MaterialTypeFormDialog
                organizationId={organizationId}
                onSuccess={closeModal}
                onCancel={closeModal}
            />,
            {
                title: "Nuevo Tipo de Material",
                description: "Crea un nuevo tipo para clasificar tus pagos de materiales.",
                size: "md"
            }
        );
    };

    const handleEdit = (type: MaterialType) => {
        openModal(
            <MaterialTypeFormDialog
                typeToEdit={type}
                organizationId={organizationId}
                onSuccess={closeModal}
                onCancel={closeModal}
            />,
            {
                title: "Editar Tipo de Material",
                description: "Modifica los detalles del tipo de material.",
                size: "md"
            }
        );
    };

    const handleDeleteClick = (type: MaterialType) => {
        setTypeToDelete(type);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!typeToDelete) return;

        startDeleteTransition(async () => {
            try {
                await deleteMaterialType(typeToDelete.id);
                toast.success("Tipo de material eliminado");
                setIsDeleteDialogOpen(false);
            } catch (error) {
                console.error(error);
                toast.error("Error al eliminar el tipo de material");
            }
        });
    };

    return (
        <ContentLayout variant="wide" className="pb-6">
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1.5">
                            <CardTitle>Tipos de Material</CardTitle>
                            <CardDescription>
                                Los tipos te ayudan a clasificar y filtrar tus pagos de materiales.
                            </CardDescription>
                        </div>
                        <Button onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Tipo
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materialTypes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No hay tipos de material definidos. Crea uno para comenzar.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    materialTypes.map((type) => (
                                        <TableRow key={type.id}>
                                            <TableCell className="font-medium">{type.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{type.description || "-"}</TableCell>
                                            <TableCell>
                                                {type.is_system ? (
                                                    <Badge variant="system" icon={<Monitor className="h-3 w-3" />}>Sistema</Badge>
                                                ) : (
                                                    <Badge variant="organization" icon={<Building2 className="h-3 w-3" />}>Personalizado</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {!type.is_system && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menú</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEdit(type)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteClick(type)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará el tipo de material
                                <strong> {typeToDelete?.name}</strong>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
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
        </ContentLayout>
    );
}
