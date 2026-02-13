"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { UploadField } from "@/components/shared/forms/fields/upload-field";
import type { UploadedFile } from "@/hooks/use-file-upload";
import { getContactFiles, linkContactFile, unlinkContactFile, ContactFile } from "@/features/contact/actions/contact-files-actions";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { useModal } from "@/stores/modal-store";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ContactFilesModalProps {
    contactId: string;
    organizationId: string;
}

export function ContactFilesModal({ contactId, organizationId }: ContactFilesModalProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Track which IDs came from the server (already persisted)
    const initialIdsRef = useRef<Set<string>>(new Set());
    // Cleanup ref to remove uploaded-but-not-confirmed files from storage on cancel
    const cleanupRef = useRef<(() => void) | null>(null);

    // Load existing files on mount
    useEffect(() => {
        async function loadFiles() {
            try {
                const serverFiles = await getContactFiles(contactId, organizationId);
                const mapped: UploadedFile[] = serverFiles.map((f: ContactFile) => ({
                    id: f.id,
                    url: f.url,
                    name: f.name,
                    type: f.type,
                    size: f.size,
                    path: f.path,
                    bucket: f.bucket,
                }));
                setFiles(mapped);
                initialIdsRef.current = new Set(mapped.map(f => f.id));
            } catch (error) {
                console.error("Error loading contact files:", error);
                toast.error("Error al cargar archivos");
            } finally {
                setIsLoading(false);
            }
        }
        loadFiles();
    }, [contactId, organizationId]);

    // Track local file changes (no DB persistence yet)
    const handleFilesChange = useCallback((value: UploadedFile | UploadedFile[] | null) => {
        const newFiles = Array.isArray(value) ? value : value ? [value] : [];
        setFiles(newFiles);
    }, []);

    // CONFIRM: persist all changes to DB
    const handleConfirm = async () => {
        setIsSaving(true);

        try {
            const currentIds = new Set(files.map(f => f.id));

            // New files: in current list but NOT in initial server set
            const newFiles = files.filter(f => !initialIdsRef.current.has(f.id));

            // Removed files: were in initial server set but NOT in current list
            const removedIds = [...initialIdsRef.current].filter(id => !currentIds.has(id));

            // Link new files
            for (const file of newFiles) {
                await linkContactFile(contactId, organizationId, {
                    path: file.path,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    bucket: file.bucket,
                });
            }

            // Unlink removed files
            for (const id of removedIds) {
                await unlinkContactFile(id);
            }

            // Single toast
            const totalChanges = newFiles.length + removedIds.length;
            if (totalChanges > 0) {
                if (newFiles.length > 0 && removedIds.length > 0) {
                    toast.success(`${newFiles.length} adjuntado(s), ${removedIds.length} eliminado(s)`);
                } else if (newFiles.length > 0) {
                    toast.success(newFiles.length === 1
                        ? "Archivo adjuntado"
                        : `${newFiles.length} archivos adjuntados`
                    );
                } else {
                    toast.success(removedIds.length === 1
                        ? "Archivo eliminado"
                        : `${removedIds.length} archivos eliminados`
                    );
                }
                router.refresh();
            }

            closeModal();
        } catch (error) {
            console.error("Error saving contact files:", error);
            toast.error("Error al guardar los archivos");
        } finally {
            setIsSaving(false);
        }
    };

    // CANCEL: cleanup uploaded files from storage and close
    const handleCancel = () => {
        cleanupRef.current?.();
        closeModal();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
                <UploadField
                    label="Archivos adjuntos"
                    mode="multi-file"
                    value={files}
                    onChange={handleFilesChange}
                    folderPath={`organizations/${organizationId}/contacts/attachments/${contactId}`}
                    maxSizeMB={10}
                    cleanupRef={cleanupRef}
                    acceptedTypes={{
                        "image/*": [],
                        "video/*": [],
                        "application/pdf": [],
                        "application/msword": [],
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
                        "application/vnd.ms-excel": [],
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
                    }}
                />
            </div>

            {/* Sticky Footer — Cancelar + Confirmar */}
            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isSaving}
                submitLabel="Confirmar"
                cancelLabel="Cancelar"
                isForm={false}
                onSubmit={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
}
