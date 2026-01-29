"use client";

import { useState, useTransition } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, Monitor, Building2 } from "lucide-react";
import { toast } from "sonner";

import { GeneralCostCategory } from "@/features/general-costs/types";
import { deleteGeneralCostCategory } from "@/features/general-costs/actions";
import { CategoryFormDialog } from "../forms/general-costs-category-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface SettingsTabProps {
    categories: GeneralCostCategory[];
    organizationId: string;
}

export function GeneralCostsSettingsView({ categories, organizationId }: SettingsTabProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<GeneralCostCategory | undefined>(undefined);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<GeneralCostCategory | null>(null);
    const [isDeleting, startDeleteTransition] = useTransition();

    const handleCreate = () => {
        setSelectedCategory(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (category: GeneralCostCategory) => {
        setSelectedCategory(category);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (category: GeneralCostCategory) => {
        setCategoryToDelete(category);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!categoryToDelete) return;

        startDeleteTransition(async () => {
            try {
                await deleteGeneralCostCategory(categoryToDelete.id);
                toast.success("Categoría eliminada");
                setIsDeleteDialogOpen(false);
            } catch (error) {
                console.error(error);
                toast.error("Error al eliminar la categoría");
            }
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1.5">
                        <CardTitle>Categorías de Gastos</CardTitle>
                        <CardDescription>
                            Las categorías te ayudan a organizar y filtrar tus egresos.
                        </CardDescription>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Categoría
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
                            {categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No hay categorías definidas. Crea una para comenzar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map((cat) => (
                                    <TableRow key={cat.id}>
                                        <TableCell className="font-medium">{cat.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{cat.description || "-"}</TableCell>
                                        <TableCell>
                                            {cat.is_system ? (
                                                <Badge variant="system" icon={<Monitor className="h-3 w-3" />}>Sistema</Badge>
                                            ) : (
                                                <Badge variant="organization" icon={<Building2 className="h-3 w-3" />}>Personalizada</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {!cat.is_system && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(cat)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(cat)}
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

            <CategoryFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                categoryToEdit={selectedCategory}
                organizationId={organizationId}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará la categoría
                            <strong> {categoryToDelete?.name}</strong>.
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

