"use client";

/**
 * SiteLog Entry Form — Hybrid Chip Form (Linear-inspired)
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │ Header (icon + title)           │
 * ├─────────────────────────────────┤
 * │ Chips (metadata):               │
 * │   Date, Type, Weather,          │
 * │   Severity, Visibility,         │
 * │   Attachments                   │
 * │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
 * │ Content (textarea, body)        │
 * ├─────────────────────────────────┤
 * │ Footer (cancel + submit)        │
 * └─────────────────────────────────┘
 */

import { useEffect, useTransition, useState, useMemo, useRef } from "react";
import { usePanel } from "@/stores/panel-store";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";

import {
    ChipRow,
    DateChip,
    SelectChip,
    SeverityChip,
    WeatherChip,
    VisibilityChip,
    AttachmentChip,
    ProjectChip,
} from "@/components/shared/chips";
import { FormTextField } from "@/components/shared/forms/fields/form-text-field";
import { formatDateForDB, parseDateFromDB } from "@/lib/timezone-data";
import type { UploadedFile } from "@/hooks/use-file-upload";

import { SiteLog, SiteLogType } from "../types";
import { createSiteLog } from "../actions";

// ─── Types ───────────────────────────────────────────────

interface SitelogEntryFormProps {
    organizationId: string;
    projectId?: string;
    descriptionType?: SiteLogType[];
    initialData?: SiteLog;
    onSuccess?: () => void;
    formId?: string;
}

// ─── Component ───────────────────────────────────────────

export function SitelogEntryForm({
    organizationId,
    projectId,
    descriptionType = [],
    initialData,
    onSuccess,
    formId,
}: SitelogEntryFormProps) {
    const router = useRouter();
    const { closePanel, setPanelMeta, completePanel } = usePanel();
    const [isPending, startTransition] = useTransition();
    const isEditing = !!initialData;
    const uploadCleanupRef = useRef<(() => void) | null>(null);

    // ─── Form state ──────────────────────────────────────
    const [logDate, setLogDate] = useState<Date>(
        initialData ? (parseDateFromDB(initialData.log_date) ?? new Date()) : new Date()
    );
    const [entryTypeId, setEntryTypeId] = useState(
        initialData?.entry_type_id || (() => {
            const general = descriptionType?.find(t => t.name.toLowerCase() === 'general');
            return general?.id || "";
        })()
    );
    const [weather, setWeather] = useState(initialData?.weather || "");
    const [severity, setSeverity] = useState(initialData?.severity || "none");
    const [isPublic, setIsPublic] = useState(initialData ? initialData.is_public : true);
    const [comments, setComments] = useState(initialData?.comments || "");
    const [mediaFiles, setMediaFiles] = useState<UploadedFile[]>(
        initialData?.media?.map((m: any) => ({
            id: m.id,
            url: m.url,
            name: m.name || "Archivo",
            type: m.type,
            size: 0,
            path: m.path || m.url,
            bucket: m.bucket || 'private-assets'
        })) || []
    );

    // Project selection (only when no projectId prop = general context)
    const showProjectChip = !projectId;
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
        initialData?.project_id || projectId || null
    );

    // ─── Panel Meta ──────────────────────────────────────
    useEffect(() => {
        setPanelMeta({
            icon: FileText,
            title: isEditing ? "Editar Registro" : "Nuevo Registro de Bitácora",
            description: isEditing
                ? "Modifica los detalles del registro."
                : "Registra las actividades, incidencias o avances del día.",
            size: "md",
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : "Crear Registro",
            },
        });
    }, [isEditing, setPanelMeta]);

    // ─── Chip options ────────────────────────────────────
    const typeChipOptions = useMemo(() =>
        descriptionType.map(type => ({
            value: type.id,
            label: type.name,
        })),
        [descriptionType]
    );

    // ─── Submit ──────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!comments.trim()) {
            toast.error("El contenido de la bitácora es requerido");
            return;
        }

        startTransition(async () => {
            try {
                const effectiveProjectId = projectId || selectedProjectId || "";
                if (!effectiveProjectId) {
                    toast.error("Debes seleccionar un proyecto");
                    return;
                }

                const result = await createSiteLog({
                    id: initialData?.id,
                    projectId: effectiveProjectId,
                    organizationId,
                    comments,
                    logDate: formatDateForDB(logDate)!,
                    entryTypeId: entryTypeId || null,
                    weather: weather || null,
                    severity: severity === "none" ? null : severity,
                    isPublic,
                    media: mediaFiles.length > 0 ? mediaFiles.map(f => ({
                        id: f.id,
                        name: f.name,
                        type: f.type,
                        url: f.url,
                        path: f.path,
                        bucket: f.bucket,
                    })) : undefined,
                });

                if (result.error) {
                    toast.error("Error al guardar registro", { description: result.error });
                    return;
                }

                toast.success(isEditing ? "Registro actualizado" : "Registro creado");
                onSuccess?.();
                router.refresh();

                if (isEditing) {
                    closePanel();
                } else {
                    completePanel(() => {
                        setComments("");
                        setLogDate(new Date());
                        setSeverity("none");
                        setIsPublic(true);
                        setMediaFiles([]);
                    });
                }
            } catch {
                toast.error("Error inesperado al guardar");
            }
        });
    };

    // ─── Render ──────────────────────────────────────────
    return (
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col flex-1">
            {/* ── Chips: Metadata ───────────────────────── */}
            <ChipRow>
                <DateChip
                    value={logDate}
                    onChange={(d) => d && setLogDate(d)}
                />
                {showProjectChip && (
                    <ProjectChip
                        value={selectedProjectId}
                        onChange={setSelectedProjectId}
                        allowNone={false}
                    />
                )}
                <SelectChip
                    value={entryTypeId}
                    onChange={setEntryTypeId}
                    options={typeChipOptions}
                    icon={<FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                    emptyLabel="Tipo"
                    searchPlaceholder="Buscar tipo..."
                    popoverWidth={200}
                />
                <WeatherChip
                    value={weather}
                    onChange={setWeather}
                />
                <SeverityChip
                    value={severity}
                    onChange={setSeverity}
                />
                <VisibilityChip
                    value={isPublic}
                    onChange={setIsPublic}
                />
                <AttachmentChip
                    value={mediaFiles}
                    onChange={setMediaFiles}
                    bucket="private-assets"
                    folderPath={`organizations/${organizationId}/sitelogs`}
                    maxSizeMB={50}
                    cleanupRef={uploadCleanupRef}
                />
            </ChipRow>

            {/* ── Body: Content ──────────────────────────── */}
            <div className="flex-1 mt-4">
                <FormTextField
                    variant="body"
                    value={comments}
                    onChange={setComments}
                    placeholder="Describe las actividades, incidencias o avances..."
                    autoFocus
                />
            </div>
        </form>
    );
}
