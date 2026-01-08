"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    createProjectModality,
    updateProjectModality,
    deleteProjectModality,
} from "@/features/projects/actions/project-settings-actions";

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
    const [modalities, setModalities] = useState<ProjectModality[]>(initialModalities);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingModality, setEditingModality] = useState<ProjectModality | null>(null);
    const [deletingModality, setDeletingModality] = useState<ProjectModality | null>(null);
    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenCreate = () => {
        setEditingModality(null);
        setName("");
        setIsModalOpen(true);
    };

    const handleOpenEdit = (modality: ProjectModality) => {
        setEditingModality(modality);
        setName(modality.name);
        setIsModalOpen(true);
    };

    const handleOpenDelete = (modality: ProjectModality) => {
        setDeletingModality(modality);
        setIsDeleteDialogOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);

        try {
            if (editingModality) {
                const result = await updateProjectModality(editingModality.id, organizationId, name.trim());
                if (result.data) {
                    setModalities(prev => prev.map(m =>
                        m.id === editingModality.id
                            ? { ...m, name: name.trim() }
                            : m
                    ));
                }
            } else {
                const result = await createProjectModality(organizationId, name.trim());
                if (result.data) {
                    setModalities(prev => [...prev, result.data]);
                }
            }
            setIsModalOpen(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingModality) return;

        const result = await deleteProjectModality(deletingModality.id);
        if (result.success) {
            setModalities(prev => prev.filter(m => m.id !== deletingModality.id));
        }
        setIsDeleteDialogOpen(false);
        setDeletingModality(null);
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
                                <TableHead>{t("name")}</TableHead>
                                <TableHead className="w-[100px] text-right">{t("actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {modalities.map((modality) => (
                                <TableRow key={modality.id}>
                                    <TableCell className="font-medium">{modality.name}</TableCell>
                                    <TableCell className="text-right">
                                        {modality.is_system ? (
                                            <Badge variant="outline" className="text-xs font-normal">System</Badge>
                                        ) : (
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

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingModality ? t("modal.editTitle") : t("modal.createTitle")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t("name")}</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t("modal.namePlaceholder")}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            {t("modal.cancel")}
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
                            {isSaving ? t("modal.saving") : t("modal.save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteConfirm.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("deleteConfirm.description")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("deleteConfirm.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t("deleteConfirm.confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
