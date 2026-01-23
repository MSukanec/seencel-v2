"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import dynamic from "next/dynamic";
import { useModal } from "@/providers/modal-store";
import { deleteProjectModality } from "@/features/projects/actions/project-settings-actions";

const ProjectModalityForm = dynamic(() => import("./project-modality-form").then(mod => mod.ProjectModalityForm), {
    loading: () => <p className="p-4">Cargando formulario...</p>
});

interface ProjectModality {
    id: string;
    name: string;
    is_system: boolean;
    organization_id: string | null;
}

interface ProjectModalitiesManagerProps {
    organizationId: string;
    initialModalities: ProjectModality[];
}

export function ProjectModalitiesManager({ organizationId, initialModalities }: ProjectModalitiesManagerProps) {
    const t = useTranslations("Project.settings.modalities");
    const { openModal } = useModal();
    const [modalities, setModalities] = useState<ProjectModality[]>(initialModalities);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingModality, setDeletingModality] = useState<ProjectModality | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleOpenCreate = () => {
        openModal(
            <ProjectModalityForm
                organizationId={organizationId}
                onSuccess={(newModality) => {
                    setModalities(prev => [...prev, newModality].sort((a, b) => a.name.localeCompare(b.name)));
                }}
            />,
            {
                title: t("modal.createTitle"),
                description: t("modal.createDescription"),
                size: 'md'
            }
        );
    };

    const handleOpenEdit = (modality: ProjectModality) => {
        openModal(
            <ProjectModalityForm
                organizationId={organizationId}
                initialData={modality}
                onSuccess={(updatedModality) => {
                    setModalities(prev => prev.map(m =>
                        m.id === updatedModality.id ? updatedModality : m
                    ).sort((a, b) => a.name.localeCompare(b.name)));
                }}
            />,
            {
                title: t("modal.editTitle"),
                description: t("modal.editDescription"),
                size: 'md'
            }
        );
    };

    const handleOpenDelete = (modality: ProjectModality) => {
        setDeletingModality(modality);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async (replacementId: string | null) => {
        if (!deletingModality) return;
        setIsDeleting(true);

        try {
            const result = await deleteProjectModality(deletingModality.id, replacementId || undefined);
            if (result.success) {
                setModalities(prev => prev.filter(m => m.id !== deletingModality.id));
            }
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setDeletingModality(null);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-lg">{t("title")}</CardTitle>
                    <CardDescription>{t("description")}</CardDescription>
                </div>
                <Button size="sm" onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("add")}
                </Button>
            </CardHeader>
            <CardContent>
                {modalities.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        {t("empty")}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-4">{t("name")}</TableHead>
                                <TableHead className="w-[180px]">{t("type")}</TableHead>
                                <TableHead className="w-[80px] text-right pr-4">{t("actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {modalities.map((modality) => (
                                <TableRow key={modality.id}>
                                    <TableCell className="font-medium pl-4">{modality.name}</TableCell>
                                    <TableCell>
                                        {modality.is_system ? (
                                            <Badge variant="system" icon={<Monitor className="h-3 w-3" />}>
                                                {t("system")}
                                            </Badge>
                                        ) : (
                                            <Badge variant="organization" icon={<Building2 className="h-3 w-3" />}>
                                                {t("organization")}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        {!modality.is_system && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">{t("actions")}</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenEdit(modality)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        {t("edit")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleOpenDelete(modality)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {t("delete")}
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

            {/* Delete Confirmation using replacement modal */}
            <DeleteReplacementModal
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setDeletingModality(null);
                }}
                onConfirm={handleDelete}
                itemToDelete={deletingModality}
                replacementOptions={modalities.filter(m => m.id !== deletingModality?.id)}
                entityLabel={t("modal.deleteConfirm.entityLabel") || "modalidad"}
                title={t("modal.deleteConfirm.title")}
                description={t("modal.deleteConfirm.description")}
            />
        </Card>
    );
}

