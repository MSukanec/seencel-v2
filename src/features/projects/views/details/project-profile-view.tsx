"use client";

// ============================================================================
// PROJECT PROFILE VIEW
// ============================================================================
// Vista de perfil del proyecto usando SettingsSection layout.
// Secciones:
//   1. Estado del Proyecto (selector + explicación de cada estado)
//   2. Información General (nombre, descripción, tipo, modalidad)
//   3. Imagen de Portada
//   4. Color Identificativo (swatches predefinidos)
// ============================================================================

import React, { useRef, useCallback, useState } from "react";
import { useLayoutData } from "@/hooks/use-layout-data";
import { ContentLayout } from "@/components/layout";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { TextField, NotesField } from "@/components/shared/forms/fields";
import { updateProject } from "@/features/projects/actions";
import { PROJECT_STATUS_CONFIG } from "@/features/projects/tables/projects-columns";
import type { StatusVariant } from "@/components/shared/data-table/columns/status-column";
import { SingleImageDropzone } from "@/components/ui/single-image-dropzone";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/client-image-compression";
import { toast } from "sonner";
import { useAutoSave } from "@/hooks/use-auto-save";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FileText,
    Image as ImageIcon,
    Check,
    Activity,
    Palette,
    MapPin,
    CheckCircle2,
    Clock,
    XCircle,
    Circle,
    CircleDot,
} from "lucide-react";
import { ProjectLocationSection } from "./project-location-section";
import { ColorPopoverContent, STANDARD_COLORS } from "@/components/shared/popovers";
import { cn } from "@/lib/utils";


// ── Color palette ──
const PROJECT_COLORS = [
    { value: "#007AFF", label: "Azul" },
    { value: "#5856D6", label: "Índigo" },
    { value: "#AF52DE", label: "Púrpura" },
    { value: "#FF2D55", label: "Rosa" },
    { value: "#FF3B30", label: "Rojo" },
    { value: "#FF9500", label: "Naranja" },
    { value: "#FFCC00", label: "Amarillo" },
    { value: "#34C759", label: "Verde" },
    { value: "#00C7BE", label: "Teal" },
    { value: "#30B0C7", label: "Cian" },
    { value: "#64748B", label: "Gris" },
    { value: "#8D6E63", label: "Marrón" },
];

// ── Status variant → visual config (matches status-column.tsx VARIANT_CONFIG) ──
const VARIANT_STYLES: Record<StatusVariant, { icon: React.ElementType; colorClass: string }> = {
    info:     { icon: CircleDot,    colorClass: "text-blue-400" },
    warning:  { icon: Clock,        colorClass: "text-semantic-warning" },
    neutral:  { icon: Circle,       colorClass: "text-muted-foreground/50" },
    positive: { icon: CheckCircle2,  colorClass: "text-amount-positive" },
    negative: { icon: XCircle,       colorClass: "text-amount-negative" },
};

// ── Status descriptions for the info panel ──
const STATUS_DESCRIPTIONS: Record<string, string> = {
    planning:  "El proyecto está en fase de planificación. No aparece en métricas operativas pero permite configurar toda la información antes de iniciarlo.",
    active:    "El proyecto está en ejecución. Aparece en el dashboard, reportes, métricas financieras y operativas. Cuenta como proyecto activo en tu plan.",
    inactive:  "Temporalmente detenido. Se conservan todos los datos pero no aparece en métricas activas ni cuenta como proyecto activo en tu plan.",
    completed: "El proyecto finalizó. Toda la información queda disponible como registro histórico pero no cuenta como proyecto activo en tu plan ni aparece en métricas operativas.",
};

// ── Props ──
interface ProjectProfileViewProps {
    project: any;
    projectTypes: { id: string; name: string }[];
    projectModalities: { id: string; name: string }[];
}

interface ProjectTextFields {
    name: string;
    description: string;
}

export function ProjectProfileView({ project, projectTypes, projectModalities }: ProjectProfileViewProps) {
    const data = project.project_data || {};
    const { updateProjectInList } = useLayoutData();

    // ── Form state ──
    const [name, setName] = useState(project.name || "");
    const [description, setDescription] = useState(data.description || project.description || "");
    const [status, setStatus] = useState(project.status || "active");
    const [typeId, setTypeId] = useState<string>(project.project_type_id || "");
    const [modalityId, setModalityId] = useState<string>(project.project_modality_id || "");
    const [color, setColor] = useState(project.color || "#007AFF");

    // ── Auto-save para campos de texto (según autosave-pattern.md) ──
    const { triggerAutoSave } = useAutoSave<ProjectTextFields>({
        saveFn: async (fields) => {
            const formData = new FormData();
            formData.set("id", project.id);
            formData.set("name", fields.name);
            formData.set("description", fields.description);
            await updateProject(formData);
        },
        validate: (fields) => !!fields.name.trim(),
        onSuccess: (fields) => {
            // Optimistic update — refresh name in header selector immediately
            updateProjectInList(project.id, { name: fields.name });
        },
    });

    // ── Immediate save for selects (no debounce needed) ──
    const saveField = useCallback(async (fieldName: string, value: string) => {
        try {
            const formData = new FormData();
            formData.set("id", project.id);
            formData.set("organization_id", project.organization_id);
            formData.set(fieldName, value);
            const result = await updateProject(formData);

            // Handle active project limit error
            if (result && 'error' in result && result.error === "ACTIVE_LIMIT_REACHED") {
                const info = result.limitInfo as { currentCount: number; maxAllowed: number };
                toast.error(
                    `Límite alcanzado: tu plan permite ${info.maxAllowed} proyecto${info.maxAllowed === 1 ? '' : 's'} activo${info.maxAllowed === 1 ? '' : 's'}. Actualmente tenés ${info.currentCount}.`
                );
                // Revert status in UI
                setStatus(project.status || "active");
                return;
            }

            toast.success("¡Cambios guardados!");
        } catch {
            toast.error("Error al guardar los cambios.");
        }
    }, [project.id, project.organization_id, project.status]);

    // ── Field change handlers ──
    const handleNameChange = (value: string) => {
        setName(value);
        triggerAutoSave({ name: value, description });
    };

    const handleDescriptionChange = (value: string) => {
        setDescription(value);
        triggerAutoSave({ name, description: value });
    };

    const handleStatusChange = (value: string) => {
        setStatus(value);
        saveField("status", value);
    };

    const handleTypeChange = (value: string) => {
        const newValue = value === "__none__" ? "" : value;
        setTypeId(newValue);
        if (newValue) {
            saveField("project_type_id", newValue);
        }
    };

    const handleModalityChange = (value: string) => {
        const newValue = value === "__none__" ? "" : value;
        setModalityId(newValue);
        if (newValue) {
            saveField("project_modality_id", newValue);
        }
    };

    const handleColorChange = (newColor: string) => {
        setColor(newColor);
        saveField("color", newColor);
    };

    // ── Image upload (immediate, not debounced) ──
    const handleImageChange = async (file: File | undefined) => {
        if (!file) return;

        const toastId = toast.loading("Procesando imagen...", { duration: Infinity });
        try {
            const compressedFile = await compressImage(file, 'project-cover');
            const supabase = createClient();
            const fileExt = compressedFile.name.split('.').pop();
            const fileName = `cover/projects/${project.organization_id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('social-assets')
                .upload(fileName, compressedFile);

            if (uploadError) throw new Error("Error al subir imagen: " + uploadError.message);

            const { data: { publicUrl } } = supabase.storage
                .from('social-assets')
                .getPublicUrl(fileName);

            // Save image_url via server action
            const formData = new FormData();
            formData.set("id", project.id);
            formData.set("image_url", publicUrl);
            await updateProject(formData);

            toast.success("Imagen actualizada.", { id: toastId });
        } catch (err: any) {
            toast.error(err.message || "Error al subir imagen.", { id: toastId });
        }
    };

    // Current status info
    const currentStatusConfig = PROJECT_STATUS_CONFIG.find(s => s.value === status) || PROJECT_STATUS_CONFIG[0];
    const currentVariantStyle = VARIANT_STYLES[currentStatusConfig.variant];

    return (
        <ContentLayout variant="narrow">
            <SettingsSectionContainer>

                {/* ── Estado del Proyecto ── */}
                <SettingsSection
                    icon={Activity}
                    title="Estado del Proyecto"
                    description="El estado determina cómo se comporta el proyecto dentro de la plataforma."
                >
                    <div className="space-y-4">
                        {/* Status selector */}
                        <Select value={status} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue>
                                    <span className="flex items-center gap-2">
                                        <currentVariantStyle.icon className={cn("h-4 w-4", currentVariantStyle.colorClass)} />
                                        {currentStatusConfig.label}
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {PROJECT_STATUS_CONFIG.map(s => {
                                    const vs = VARIANT_STYLES[s.variant];
                                    return (
                                        <SelectItem key={s.value} value={s.value}>
                                            <span className="flex items-center gap-2">
                                                <vs.icon className={cn("h-4 w-4", vs.colorClass)} />
                                                {s.label}
                                            </span>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>

                        {/* Status description */}
                        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                            <div className="space-y-2.5">
                                {PROJECT_STATUS_CONFIG.map(s => {
                                    const vs = VARIANT_STYLES[s.variant];
                                    return (
                                        <div
                                            key={s.value}
                                            className={cn(
                                                "flex items-start gap-2.5 text-sm transition-opacity",
                                                s.value === status ? "opacity-100" : "opacity-40"
                                            )}
                                        >
                                            <vs.icon className={cn("h-4 w-4 mt-0.5 shrink-0", vs.colorClass)} />
                                            <div>
                                                <span className="font-medium">{s.label}:</span>{" "}
                                                <span className="text-muted-foreground">{STATUS_DESCRIPTIONS[s.value] || ""}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </SettingsSection>

                {/* ── Información General ── */}
                <SettingsSection
                    icon={FileText}
                    title="Información General"
                    description="Detalles básicos e identificación del proyecto."
                >
                    <div className="space-y-4">
                        <TextField
                            label="Nombre del Proyecto"
                            value={name}
                            onChange={handleNameChange}
                            placeholder="Ej: Torre Norte, Casa Martínez..."
                            required
                        />
                        <NotesField
                            label="Descripción"
                            value={description}
                            onChange={handleDescriptionChange}
                            placeholder="Descripción general del proyecto, alcance, objetivos..."
                            rows={4}
                        />

                        {/* ── Tipo y Modalidad ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">
                                    Tipo de Proyecto
                                </label>
                                <Select value={typeId || "__none__"} onValueChange={handleTypeChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seleccionar tipo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">
                                            <span className="text-muted-foreground">Sin tipo</span>
                                        </SelectItem>
                                        {projectTypes.map(t => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Ej: Residencial, Comercial, Industrial, Infraestructura
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">
                                    Modalidad
                                </label>
                                <Select value={modalityId || "__none__"} onValueChange={handleModalityChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seleccionar modalidad..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">
                                            <span className="text-muted-foreground">Sin modalidad</span>
                                        </SelectItem>
                                        {projectModalities.map(m => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Ej: Contratista, Administración, Llave en Mano
                                </p>
                            </div>
                        </div>
                    </div>
                </SettingsSection>

                {/* ── Imagen de Portada ── */}
                <SettingsSection
                    icon={ImageIcon}
                    title="Imagen de Portada"
                    description="La imagen principal que representa el proyecto. Se usa en cards y encabezados."
                >
                    <SingleImageDropzone
                        height={200}
                        value={project.image_url}
                        onChange={handleImageChange}
                        className="w-full"
                        dropzoneLabel="Arrastra una imagen o haz clic para subir"
                    />
                </SettingsSection>

                {/* ── Color Identificativo ── */}
                <SettingsSection
                    icon={Palette}
                    title="Color Identificativo"
                    description="Asigna un color único a este proyecto para diferenciarlo visualmente en toda la plataforma."
                >
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-2">
                        <ColorPopoverContent
                            colors={STANDARD_COLORS}
                            currentValue={color}
                            onSelect={handleColorChange}
                            showPicker
                        />
                    </div>
                </SettingsSection>

                {/* ── Ubicación ── */}
                <SettingsSection
                    icon={MapPin}
                    title="Ubicación"
                    description="Define la ubicación geográfica de la obra para visualizarla en el mapa de proyectos."
                >
                    <ProjectLocationSection project={project} />
                </SettingsSection>

            </SettingsSectionContainer>
        </ContentLayout>
    );
}
