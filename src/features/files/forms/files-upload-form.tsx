"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { usePanel } from "@/stores/panel-store";
import { UploadField } from "@/components/shared/forms/fields/upload-field";
import { Upload } from "lucide-react";
import { type UploadedFile } from "@/hooks/use-file-upload";
import { uploadFiles } from "@/features/files/actions";
import { ProjectField } from "@/components/shared/forms/fields/project-field";

// ============================================================================
// FILES UPLOAD FORM
// ============================================================================

interface FilesUploadFormProps {
    organizationId: string;
    maxFileSizeMb: number;
    /** Projects available for selection (org-level context) */
    projects?: { id: string; name: string }[];
    /** Pre-selected project (project-level context) */
    activeProjectId?: string | null;
    /** Injected by PanelProvider — connects form to footer submit */
    formId?: string;
}

export function FilesUploadForm({ organizationId, maxFileSizeMb, projects = [], activeProjectId, formId }: FilesUploadFormProps) {
    const router = useRouter();
    const { closePanel, setPanelMeta } = usePanel();
    const uploadedFilesRef = useRef<UploadedFile[]>([]);
    const cleanupRef = useRef<(() => void) | null>(null);

    // -1 = unlimited (plan features convention). Resolve to practical cap.
    const effectiveMaxSize = maxFileSizeMb < 0 ? 1024 : maxFileSizeMb;

    // 🚨 OBLIGATORIO: Self-describe panel header + footer
    useEffect(() => {
        setPanelMeta({
            icon: Upload,
            title: "Subir Archivos",
            description: "Seleccioná los archivos que querés subir a tu organización",
            size: "md",
            footer: {
                submitLabel: "Subir",
            },
        });
    }, [setPanelMeta]);

    const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || "none");
    const showProjectSelector = !activeProjectId && projects.length > 0;

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
        const projectId = selectedProjectId === "none" ? undefined : selectedProjectId;

        // Optimistic: close panel + toast immediately
        closePanel();
        toast.success(
            count === 1
                ? "Archivo subido correctamente"
                : `${count} archivos subidos correctamente`
        );

        // Server action in background
        try {
            const result = await uploadFiles(organizationId, filesToUpload, projectId);
            if (!result.success) {
                toast.error(result.error || "Error al registrar archivos en el sistema");
            }
            router.refresh();
        } catch {
            toast.error("Error inesperado al registrar archivos");
        }
    };

    // Show upgrade hint if plan allows less than max tier (TEAMS = 1024MB)
    const upgradeHint = useMemo(() => {
        if (effectiveMaxSize >= 1024) return undefined;
        return {
            message: "¿Necesitás subir archivos más grandes? Mejorá tu plan →",
            onClick: () => {
                closePanel();
                router.push("/pricing" as any);
            },
        };
    }, [effectiveMaxSize, closePanel, router]);

    // Contextual rejection message when file exceeds plan limit
    const handleFileTooLarge = useCallback((fileName: string, fileSizeMB: number, maxSizeMB: number) => {
        const nextPlan = maxSizeMB <= 50 ? "Pro" : maxSizeMB <= 500 ? "Teams" : null;
        const upgradeText = nextPlan
            ? `Actualizá a ${nextPlan} para subir archivos más grandes.`
            : "";

        toast.error(
            `Tu plan permite archivos de hasta ${maxSizeMB} MB.\n"${fileName}" pesa ${fileSizeMB} MB.${upgradeText ? `\n${upgradeText}` : ""}`,
            { duration: 6000 }
        );
    }, []);

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
            {/* Project selector — only in org-level context */}
            {showProjectSelector && (
                <ProjectField
                    value={selectedProjectId}
                    onChange={setSelectedProjectId}
                    projects={projects}
                    allowNone
                    noneLabel="Sin proyecto"
                    tooltip="Seleccioná el proyecto al que pertenecen estos archivos. Si no seleccionás ninguno, se subirán a nivel de organización."
                />
            )}

            <UploadField
                label="Archivos"
                mode="multi-file"
                value={uploadedFilesRef.current}
                onChange={handleFilesChange}
                folderPath={`organizations/${organizationId}/files`}
                maxSizeMB={effectiveMaxSize}
                dropzoneLabel="Subir archivos"
                upgradeHint={upgradeHint}
                onFileTooLarge={handleFileTooLarge}
                cleanupRef={cleanupRef}
            />
        </form>
    );
}
