"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, MoreHorizontal, Monitor, Building2 } from "lucide-react";
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
    createProjectType,
    updateProjectType,
    deleteProjectType,
} from "@/features/projects/actions/project-settings-actions";

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
    const [types, setTypes] = useState<ProjectType[]>(initialTypes);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<ProjectType | null>(null);
    const [deletingType, setDeletingType] = useState<ProjectType | null>(null);
    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenCreate = () => {
        setEditingType(null);
        setName("");
        setIsModalOpen(true);
    };

    const handleOpenEdit = (type: ProjectType) => {
        setEditingType(type);
        setName(type.name);
        setIsModalOpen(true);
    };

    const handleOpenDelete = (type: ProjectType) => {
        setDeletingType(type);
        setIsDeleteDialogOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);

        try {
            if (editingType) {
                const result = await updateProjectType(editingType.id, organizationId, name.trim());
                if (result.data) {
                    setTypes(prev => prev.map(t =>
                        t.id === editingType.id
                            ? { ...t, name: name.trim() }
                            : t
                    ));
                }
            } else {
                const result = await createProjectType(organizationId, name.trim());
                if (result.data) {
                    setTypes(prev => [...prev, result.data]);
                }
            }
            setIsModalOpen(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingType) return;

        const result = await deleteProjectType(deletingType.id);
        if (result.success) {
            setTypes(prev => prev.filter(t => t.id !== deletingType.id));
        }
        setIsDeleteDialogOpen(false);
        setDeletingType(null);
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

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingType ? t("modal.editTitle") : t("modal.createTitle")}
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
