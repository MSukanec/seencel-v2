"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { UploadField } from "@/components/shared/forms/fields/upload-field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FolderOpen, FolderPlus, Loader2 } from "lucide-react";
import { type UploadedFile } from "@/hooks/use-file-upload";
import { uploadFiles, createFolder } from "@/features/files/actions";
import type { Folder } from "@/features/files/types";
import { ProjectField } from "@/components/shared/forms/fields/project-field";

// ============================================================================
// FILES UPLOAD FORM
// ============================================================================

interface FilesUploadFormProps {
    organizationId: string;
    maxFileSizeMb: number;
    folders?: Folder[];
    /** Projects available for selection (org-level context) */
    projects?: { id: string; name: string }[];
    /** Pre-selected project (project-level context) */
    activeProjectId?: string | null;
}

export function FilesUploadForm({ organizationId, maxFileSizeMb, folders = [], projects = [], activeProjectId }: FilesUploadFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const uploadedFilesRef = useRef<UploadedFile[]>([]);
    const cleanupRef = useRef<(() => void) | null>(null);

    // Root-level folders for the selector, sorted alphabetically
    const rootFolders = useMemo(() =>
        folders.filter(f => !f.parent_id).sort((a, b) => a.name.localeCompare(b.name)),
        [folders]
    );

    // Pre-select first folder alphabetically, or __none__ if no folders exist
    const [selectedFolderId, setSelectedFolderId] = useState<string>(
        rootFolders.length > 0 ? rootFolders[0].id : "__none__"
    );

    // Inline folder creation
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [localFolders, setLocalFolders] = useState<Folder[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || "none");
    const showProjectSelector = !activeProjectId && projects.length > 0;

    // Combine server folders + locally created folders
    const allRootFolders = useMemo(() => {
        const combined = [...rootFolders, ...localFolders];
        return combined.sort((a, b) => a.name.localeCompare(b.name));
    }, [rootFolders, localFolders]);

    // Track files by ref to avoid stale closures in optimistic handler
    const handleFilesChange = useCallback((files: UploadedFile | UploadedFile[] | null) => {
        if (Array.isArray(files)) {
            uploadedFilesRef.current = files;
        } else if (files) {
            uploadedFilesRef.current = [files];
        } else {
            uploadedFilesRef.current = [];
        }
    }, []);

    // Cancel: close modal + cleanup orphaned files from storage
    const handleCancel = useCallback(() => {
        cleanupRef.current?.();
        closeModal();
    }, [closeModal]);

    // Inline create folder
    const handleCreateFolder = async () => {
        const trimmed = newFolderName.trim();
        if (!trimmed) return;

        // Check for duplicates
        if (allRootFolders.some(f => f.name.toLowerCase() === trimmed.toLowerCase())) {
            toast.error("Ya existe una carpeta con ese nombre");
            return;
        }

        setIsCreatingFolder(true);
        try {
            const result = await createFolder(organizationId, trimmed);
            if (result.success && result.data) {
                const newFolder = result.data as Folder;
                setLocalFolders(prev => [...prev, newFolder]);
                setSelectedFolderId(newFolder.id);
                setNewFolderName("");
                setShowNewFolder(false);
                toast.success(`Carpeta "${trimmed}" creada`);
            } else {
                toast.error(result.error || "Error al crear carpeta");
            }
        } catch {
            toast.error("Error inesperado al crear carpeta");
        } finally {
            setIsCreatingFolder(false);
        }
    };

    // Submit: optimistic close, server action in background
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const files = uploadedFilesRef.current;

        if (files.length === 0) {
            toast.error("Agregá al menos un archivo");
            return;
        }

        // Snapshot data before closing
        const filesToUpload = files.map((f) => ({
            bucket: f.bucket,
            path: f.path,
            name: f.name,
            type: f.type,
            size: f.size,
        }));
        const count = files.length;
        const folderId = selectedFolderId === "__none__" ? undefined : selectedFolderId;
        const projectId = selectedProjectId === "none" ? undefined : selectedProjectId;

        // Optimistic: close modal + toast immediately
        closeModal();
        toast.success(
            count === 1
                ? "Archivo subido correctamente"
                : `${count} documentos subidos correctamente`
        );

        // Server action in background
        try {
            const result = await uploadFiles(organizationId, filesToUpload, folderId, projectId);
            if (!result.success) {
                toast.error(result.error || "Error al registrar documentos en el sistema");
            }
            router.refresh();
        } catch {
            toast.error("Error inesperado al registrar documentos");
        }
    };

    // Show upgrade hint if plan allows less than max tier (TEAMS = 1024MB)
    const upgradeHint = useMemo(() => {
        if (maxFileSizeMb >= 1024) return undefined;
        return {
            message: "¿Necesitás subir documentos más grandes? Mejorá tu plan →",
            onClick: () => {
                closeModal();
                router.push("/pricing" as any);
            },
        };
    }, [maxFileSizeMb, closeModal, router]);

    // Contextual rejection message when file exceeds plan limit
    const handleFileTooLarge = useCallback((fileName: string, fileSizeMB: number, maxSizeMB: number) => {
        const nextPlan = maxSizeMB <= 50 ? "Pro" : maxSizeMB <= 500 ? "Teams" : null;
        const upgradeText = nextPlan
            ? `Actualizá a ${nextPlan} para subir documentos más grandes.`
            : "";

        toast.error(
            `Tu plan permite documentos de hasta ${maxSizeMB} MB.\n"${fileName}" pesa ${fileSizeMB} MB.${upgradeText ? `\n${upgradeText}` : ""}`,
            { duration: 6000 }
        );
    }, []);

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4">
                {/* Project selector — only in org-level context */}
                {showProjectSelector && (
                    <ProjectField
                        value={selectedProjectId}
                        onChange={setSelectedProjectId}
                        projects={projects}
                        allowNone
                        noneLabel="Sin proyecto"
                        tooltip="Seleccioná el proyecto al que pertenecen estos documentos. Si no seleccionás ninguno, se subirán a nivel de organización."
                    />
                )}

                {/* Folder selector — always visible */}
                <div className="space-y-2">
                    <Label htmlFor="folder-select" className="flex items-center gap-1.5">
                        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        Carpeta
                    </Label>
                    <div className="flex items-center gap-2">
                        <Select
                            value={selectedFolderId}
                            onValueChange={setSelectedFolderId}
                        >
                            <SelectTrigger id="folder-select" className="flex-1">
                                <SelectValue placeholder="Sin carpeta" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Sin carpeta</SelectItem>
                                {allRootFolders.map((folder) => (
                                    <SelectItem key={folder.id} value={folder.id}>
                                        {folder.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => setShowNewFolder(!showNewFolder)}
                            title="Crear carpeta"
                        >
                            <FolderPlus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Inline new folder creation */}
                    {showNewFolder && (
                        <div className="flex items-center gap-2 mt-2">
                            <Input
                                placeholder="Nombre de carpeta..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleCreateFolder();
                                    }
                                }}
                                disabled={isCreatingFolder}
                                autoFocus
                            />
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleCreateFolder}
                                disabled={isCreatingFolder || !newFolderName.trim()}
                            >
                                {isCreatingFolder ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Crear"
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                <UploadField
                    label="Documentos"
                    mode="multi-file"
                    value={uploadedFilesRef.current}
                    onChange={handleFilesChange}
                    folderPath={`organizations/${organizationId}/files`}
                    maxSizeMB={maxFileSizeMb}
                    dropzoneLabel="Subir archivos"
                    upgradeHint={upgradeHint}
                    onFileTooLarge={handleFileTooLarge}
                    cleanupRef={cleanupRef}
                />
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                submitLabel="Subir"
                onCancel={handleCancel}
            />
        </form>
    );
}
