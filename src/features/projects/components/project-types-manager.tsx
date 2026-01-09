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
import { DeleteConfirmationDialog } from "@/components/global/delete-confirmation-dialog";
import { useModal } from "@/providers/modal-store";
import { ProjectTypeForm } from "./ProjectTypeForm";
import { deleteProjectType } from "@/features/projects/actions/project-settings-actions";

interface ProjectType {
    id: string;
    name: string;
    is_system: boolean;
    organization_id: string | null;
}

interface ProjectTypesManagerProps {
    organizationId: string;
    initialTypes: ProjectType[];
}

export function ProjectTypesManager({ organizationId, initialTypes }: ProjectTypesManagerProps) {
    const t = useTranslations("Project.settings.types");
    const { openModal } = useModal();
    const [types, setTypes] = useState<ProjectType[]>(initialTypes);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingType, setDeletingType] = useState<ProjectType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleOpenCreate = () => {
        openModal(
            <ProjectTypeForm
                organizationId={organizationId}
                onSuccess={(newType) => {
                    setTypes(prev => [...prev, newType]);
                }}
            />,
            {
                title: t("modal.createTitle"),
                description: t("modal.createDescription")
            }
        );
    };

    const handleOpenEdit = (type: ProjectType) => {
        openModal(
            <ProjectTypeForm
                organizationId={organizationId}
                initialData={type}
                onSuccess={(updatedType) => {
                    setTypes(prev => prev.map(t =>
                        t.id === updatedType.id ? updatedType : t
                    ));
                }}
            />,
            {
                title: t("modal.editTitle"),
                description: t("modal.editDescription")
            }
        );
    };

    const handleOpenDelete = (type: ProjectType) => {
        setDeletingType(type);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingType) return;
        setIsDeleting(true);

        try {
            const result = await deleteProjectType(deletingType.id);
            if (result.success) {
                setTypes(prev => prev.filter(t => t.id !== deletingType.id));
            }
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
                    <CardTitle className="text-lg">{t("title")}</CardTitle>
                    <CardDescription>{t("description")}</CardDescription>
                </div>
                <Button size="sm" onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("add")}
                </Button>
            </CardHeader>
            <CardContent>
                {types.length === 0 ? (
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
                            {types.map((type) => (
                                <TableRow key={type.id}>
                                    <TableCell className="font-medium pl-4">{type.name}</TableCell>
                                    <TableCell>
                                        {type.is_system ? (
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
                                        {!type.is_system && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">{t("actions")}</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenEdit(type)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        {t("edit")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleOpenDelete(type)}
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

            {/* Delete Confirmation using global component */}
            <DeleteConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDelete}
                title={t("deleteConfirm.title")}
                description={t("deleteConfirm.description")}
                confirmLabel={t("deleteConfirm.confirm")}
                cancelLabel={t("deleteConfirm.cancel")}
                isDeleting={isDeleting}
            />
        </Card>
    );
}
