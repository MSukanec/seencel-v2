"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, MoreHorizontal, Monitor, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteReplacementModal } from "@/components/shared/delete-replacement-modal";
import { useModal } from "@/providers/modal-store";
import { deleteSiteLogType, SiteLogType } from "@/actions/sitelog";
import { SiteLogTypeForm } from "./sitelog-type-form";

interface SiteLogTypesManagerProps {
    organizationId: string;
    initialTypes: SiteLogType[];
}

export function SiteLogTypesManager({ organizationId, initialTypes }: SiteLogTypesManagerProps) {
    const { openModal } = useModal();
    const title = "Tipos de Bitácora";
    const description = "Gestiona las categorías para tus registros de bitácora.";

    const [types, setTypes] = useState<SiteLogType[]>(initialTypes);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingType, setDeletingType] = useState<SiteLogType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleOpenCreate = () => {
        openModal(
            <SiteLogTypeForm
                organizationId={organizationId}
                onSuccess={(newType) => {
                    setTypes(prev => [...prev, newType].sort((a, b) => a.name.localeCompare(b.name)));
                }}
            />,
            {
                title: "Crear Tipo",
                description: "Define un nuevo tipo para clasificar tus registros.",
                size: 'md'
            }
        );
    };

    const handleOpenEdit = (type: SiteLogType) => {
        openModal(
            <SiteLogTypeForm
                organizationId={organizationId}
                initialData={type}
                onSuccess={(updatedType) => {
                    setTypes(prev => prev.map(t =>
                        t.id === updatedType.id ? updatedType : t
                    ).sort((a, b) => a.name.localeCompare(b.name)));
                }}
            />,
            {
                title: "Editar Tipo",
                description: "Modifica el nombre de este tipo de bitácora.",
                size: 'md'
            }
        );
    };

    const handleOpenDelete = (type: SiteLogType) => {
        setDeletingType(type);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async (replacementId: string | null) => {
        if (!deletingType) return;
        setIsDeleting(true);

        try {
            await deleteSiteLogType(deletingType.id, replacementId || undefined);
            setTypes(prev => prev.filter(t => t.id !== deletingType.id));
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setDeletingType(null);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                <Button size="sm" onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                </Button>
            </CardHeader>
            <CardContent>
                {types.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        No hay tipos definidos.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-4">Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="w-[180px]">Origen</TableHead>
                                <TableHead className="w-[80px] text-right pr-4">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {types.map((type) => (
                                <TableRow key={type.id}>
                                    <TableCell className="font-medium pl-4">{type.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{type.description || "-"}</TableCell>
                                    <TableCell>
                                        {/* Using is_system from SiteLogType definition rather than org check strictly, though redundant check is fine */}
                                        {type.is_system ? (
                                            <Badge variant="system" icon={<Monitor className="h-3 w-3" />}>
                                                Sistema
                                            </Badge>
                                        ) : (
                                            <Badge variant="organization" icon={<Building2 className="h-3 w-3" />}>
                                                Organización
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        {/* Only allow editing/deleting if NOT system or if we implement override later. RLS will block anyway but UI should reflect. */}
                                        {!type.is_system && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Acciones</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenEdit(type)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleOpenDelete(type)}
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
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <DeleteReplacementModal
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setDeletingType(null);
                }}
                onConfirm={handleDelete}
                itemToDelete={deletingType ? { id: deletingType.id, name: deletingType.name } : null}
                replacementOptions={types.filter(t => t.id !== deletingType?.id)}
                entityLabel="tipo de bitácora"
                title="Eliminar Tipo"
                description="Si eliminas este tipo, puedes elegir otro para reasignar los registros que to tenían."
            />
        </Card>
    );
}
