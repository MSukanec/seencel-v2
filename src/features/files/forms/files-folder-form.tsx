"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useModal } from "@/stores/modal-store";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { createFolder, renameFolder } from "../actions";
import type { Folder } from "../types";

// ============================================================================
// FILES — FOLDER FORM (Semi-Autónomo con Optimistic Callback)
// ============================================================================

interface FilesFolderFormProps {
    organizationId: string;
    /** If editing an existing folder */
    editFolder?: Folder;
    /** Parent folder ID for creating a subfolder */
    parentId?: string | null;
    /** Optimistic callback — called BEFORE server responds to update UI instantly */
    onOptimisticCreate?: (folder: Folder) => void;
    /** Optimistic callback for rename */
    onOptimisticRename?: (folderId: string, newName: string) => void;
}

export function FilesFolderForm({
    organizationId,
    editFolder,
    parentId,
    onOptimisticCreate,
    onOptimisticRename,
}: FilesFolderFormProps) {
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(editFolder?.name ?? "");
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!editFolder;

    const handleCancel = () => {
        closeModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmed = name.trim();
        if (!trimmed) {
            setError("El nombre es obligatorio");
            return;
        }

        setIsLoading(true);
        setError(null);

        if (isEditing) {
            // 1. Optimistic update UI — rename instantly
            onOptimisticRename?.(editFolder.id, trimmed);

            // 2. Close modal immediately
            closeModal();
            toast.success(`Carpeta renombrada a "${trimmed}"`);

            // 3. Server action in background
            try {
                const result = await renameFolder(editFolder.id, trimmed);
                if (!result.success) {
                    toast.error(result.error || "Error al renombrar");
                }
            } catch {
                toast.error("Error inesperado al renombrar");
            }
        } else {
            // 1. Create optimistic folder with temp ID
            const tempId = `temp-${Date.now()}`;
            const optimisticFolder: Folder = {
                id: tempId,
                organization_id: organizationId,
                name: trimmed,
                parent_id: parentId || null,
                project_id: null,
                created_by: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                file_count: 0,
            };

            // 2. Optimistic update UI — add folder instantly
            onOptimisticCreate?.(optimisticFolder);

            // 3. Close modal immediately
            closeModal();
            toast.success(`Carpeta "${trimmed}" creada`);

            // 4. Server action in background
            try {
                const result = await createFolder(organizationId, trimmed, parentId);
                if (!result.success) {
                    toast.error(result.error || "Error al crear carpeta");
                }
            } catch {
                toast.error("Error inesperado al crear carpeta");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <FormGroup label="Nombre" required>
                    <Input
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (error) setError(null);
                        }}
                        placeholder="Ej: Contratos, Planos, BIM..."
                        autoFocus
                        maxLength={100}
                        disabled={isLoading}
                    />
                    {error && (
                        <p className="text-sm text-destructive mt-1">{error}</p>
                    )}
                </FormGroup>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Carpeta"}
                onCancel={handleCancel}
            />
        </form>
    );
}
