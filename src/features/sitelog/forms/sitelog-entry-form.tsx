"use client";

import { useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { FormFooter } from "@/components/shared/forms/form-footer";
import {
    DateField,
    NotesField,
    SelectField,
    SwitchField,
    UploadField,
} from "@/components/shared/forms/fields";
import { cn } from "@/lib/utils";
import { formatDateForDB, parseDateFromDB } from "@/lib/timezone-data";
import type { UploadedFile } from "@/hooks/use-file-upload";

import { useModal } from "@/stores/modal-store";
import { useRouter } from "@/i18n/routing";

import { SiteLog, SiteLogType } from "../types";
import { createSiteLog } from "../actions";
import { WEATHER_CONFIG, SEVERITY_OPTIONS } from "../constants";

const formSchema = z.object({
    comments: z.string().min(1, "El contenido de la bitácora es requerido"),
    log_date: z.date(),
    entry_type_id: z.string().optional(),
    weather: z.string().optional(),
    severity: z.string().default("low"),
    is_public: z.boolean().default(true),
});

interface SitelogEntryFormProps {
    organizationId: string;
    projectId?: string;
    descriptionType?: SiteLogType[];
    initialData?: SiteLog;
}

type FormValues = z.infer<typeof formSchema>;

export function SitelogEntryForm({
    organizationId,
    projectId,
    descriptionType = [],
    initialData,
}: SitelogEntryFormProps) {
    const t = useTranslations('Sitelog');
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // Media files — UploadField manages uploads automatically
    const initialMediaFiles: UploadedFile[] = initialData?.media?.map((m: any) => ({
        id: m.id,
        url: m.url,
        name: m.name || "Archivo",
        type: m.type,
        size: 0,
        path: m.path || m.url,
        bucket: m.bucket || 'private-assets'
    })) || [];

    const [mediaFiles, setMediaFiles] = useState<UploadedFile[]>(initialMediaFiles);

    // Cleanup ref for UploadField — call on cancel to remove uploaded files from storage
    const uploadCleanupRef = useRef<(() => void) | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            comments: initialData?.comments || "",
            log_date: initialData ? (parseDateFromDB(initialData.log_date) ?? new Date()) : new Date(),
            severity: initialData?.severity || "low",
            is_public: initialData ? initialData.is_public : true,
            entry_type_id: initialData?.entry_type_id || (() => {
                const general = descriptionType?.find(t => t.name.toLowerCase() === 'general');
                return general?.id;
            })(),
            weather: (() => {
                if (!initialData?.weather) return undefined;
                const w = initialData.weather.toLowerCase().trim();
                const exactMatch = WEATHER_CONFIG.find(opt => opt.value === w);
                if (exactMatch) return exactMatch.value;
                const partialMatch = WEATHER_CONFIG.find(opt => w.includes(opt.value));
                if (partialMatch) return partialMatch.value;
                return undefined;
            })(),
        },
    });

    // Memoize SelectField options
    const typeOptions = useMemo(() =>
        descriptionType.map(type => ({
            value: type.id,
            label: type.name,
        })),
        [descriptionType]
    );

    const weatherOptions = useMemo(() =>
        WEATHER_CONFIG.map(opt => ({
            value: opt.value,
            label: opt.label,
        })),
        []
    );

    const severityOptions = useMemo(() =>
        SEVERITY_OPTIONS.map(opt => ({
            value: opt.value,
            label: opt.label,
        })),
        []
    );

    // Semi-autonomous callbacks
    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        // Cleanup uploaded files if canceling (UploadField auto-uploads)
        uploadCleanupRef.current?.();
        closeModal();
    };

    async function onSubmit(values: FormValues) {
        setIsLoading(true);

        const formData = new FormData();

        if (projectId) {
            formData.append('project_id', projectId);
        }
        formData.append('organization_id', organizationId);
        formData.append('comments', values.comments);
        formData.append('log_date', formatDateForDB(values.log_date)!);
        formData.append('severity', values.severity);
        formData.append('is_public', String(values.is_public));

        if (initialData?.id) {
            formData.append('id', initialData.id);
        }

        if (values.entry_type_id) {
            formData.append('entry_type_id', values.entry_type_id);
        }
        if (values.weather) {
            formData.append('weather', values.weather);
        }

        // UploadField already uploaded files — just serialize the references
        if (mediaFiles.length > 0) {
            formData.append('media', JSON.stringify(mediaFiles));
        }

        try {
            const result = await createSiteLog(formData);

            if (result.error) {
                toast.error("Error al guardar registro", {
                    description: result.error
                });
            } else {
                toast.success(isEditing ? "Registro actualizado" : "Registro creado", {
                    description: isEditing
                        ? "Se ha actualizado la entrada de la bitácora."
                        : "Se ha añadido la entrada a la bitácora."
                });
                handleSuccess();
            }
        } catch (error) {
            toast.error("Error inesperado al guardar");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                <div className="space-y-4">
                    {/* Row 1: Date & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DateField
                            value={form.watch("log_date")}
                            onChange={(date) => date && form.setValue("log_date", date)}
                            label="Fecha del registro"
                        />

                        <SelectField
                            value={form.watch("entry_type_id") || ""}
                            onChange={(val) => form.setValue("entry_type_id", val)}
                            options={typeOptions}
                            label="Tipo de entrada"
                            placeholder="Seleccionar tipo..."
                            required={false}
                            clearable
                        />
                    </div>

                    {/* Row 2: Weather & Severity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField
                            value={form.watch("weather") || ""}
                            onChange={(val) => form.setValue("weather", val)}
                            options={weatherOptions}
                            label="Clima"
                            placeholder={t('weather.placeholder')}
                            required={false}
                            clearable
                            renderOption={(option) => {
                                const config = WEATHER_CONFIG.find(w => w.value === option.value);
                                if (!config) return option.label;
                                const Icon = config.icon;
                                return (
                                    <div className="flex items-center gap-2">
                                        <Icon className={cn("h-4 w-4", config.color)} />
                                        <span>{option.label}</span>
                                    </div>
                                );
                            }}
                        />

                        <SelectField
                            value={form.watch("severity")}
                            onChange={(val) => form.setValue("severity", val)}
                            options={severityOptions}
                            label="Impacto en obra"
                            placeholder="Seleccionar impacto..."
                            renderOption={(option) => {
                                const config = SEVERITY_OPTIONS.find(s => s.value === option.value);
                                if (!config) return option.label;
                                return (
                                    <div className="flex items-center gap-2">
                                        <div className={cn("h-2 w-2 rounded-full", config.color)} />
                                        <span>{option.label}</span>
                                    </div>
                                );
                            }}
                        />
                    </div>

                    {/* Row 3: Content */}
                    <NotesField
                        value={form.watch("comments")}
                        onChange={(val) => form.setValue("comments", val)}
                        label="Contenido del registro"
                        placeholder="Describe las actividades, incidencias o avances..."
                        required
                        rows={5}
                    />

                    {/* Row 4: Attachments — UploadField Factory (auto-uploads) */}
                    <UploadField
                        label="Archivos adjuntos"
                        mode="gallery"
                        value={mediaFiles}
                        onChange={(files) => setMediaFiles(files as UploadedFile[])}
                        folderPath={`organizations/${organizationId}/sitelogs`}
                        acceptedTypes={{
                            'image/*': [],
                            'video/*': [],
                            'application/pdf': []
                        }}
                        cleanupRef={uploadCleanupRef}
                        required={false}
                    />

                    {/* Row 5: Visibility */}
                    <SwitchField
                        value={form.watch("is_public")}
                        onChange={(val) => form.setValue("is_public", val)}
                        label="Visible para cliente"
                        description="Si se desactiva, este registro solo será visible para el equipo interno."
                    />
                </div>
            </div>

            <FormFooter
                submitLabel={isEditing ? "Guardar cambios" : "Crear registro"}
                isLoading={isLoading}
                onCancel={handleCancel}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
