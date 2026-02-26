"use client";

import { createProject, updateProject } from "@/features/projects/actions";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePanel } from "@/stores/panel-store";
import { SelectField } from "@/components/shared/forms/fields/select-field";
import { TextField } from "@/components/shared/forms/fields/text-field";
import { ColorField } from "@/components/shared/forms/fields/color-field";
import { UploadField, type ImagePalette } from "@/components/shared/forms/fields/upload-field";
import type { UploadedFile } from "@/hooks/use-file-upload";
import { ProjectSwapModal } from "@/features/projects/components/project-swap-modal";
import { type Project } from "@/components/shared/forms/fields";

import { ProjectType, ProjectModality } from "@/types/project";
import { toast } from "sonner";
import { Building } from "lucide-react";

// Color palette for projects
const PROJECT_COLORS = [
    "#007AFF", "#34C759", "#FFCC00", "#FF3B30",
    "#AF52DE", "#5856D6", "#00C7BE",
];


interface ProjectsProjectFormProps {
    mode: 'create' | 'edit';
    initialData?: any;
    organizationId: string;
    /** Project types from server — avoids client-side fetch */
    types?: ProjectType[];
    /** Project modalities from server — avoids client-side fetch */
    modalities?: ProjectModality[];
    /** Called with project data after successful create/update. View handles state update. */
    onSuccess?: (project: any) => void;
    /** Plan limit info for active project enforcement */
    maxActiveProjects?: number;
    activeProjectsCount?: number;
    /** List of currently active projects (for swap modal) */
    activeProjects?: Project[];
    formId?: string;
}

export function ProjectsProjectForm({
    mode,
    initialData,
    organizationId,
    types = [],
    modalities = [],
    onSuccess,
    maxActiveProjects = -1,
    activeProjectsCount = 0,
    activeProjects = [],
    formId,
}: ProjectsProjectFormProps) {
    const { closePanel, setPanelMeta } = usePanel();
    const [isLoading, setIsLoading] = useState(false);
    const t = useTranslations('Project.form');
    const isEditing = mode === 'edit';

    // Self-describe
    useEffect(() => {
        setPanelMeta({
            icon: Building,
            title: isEditing ? "Editar Proyecto" : t('createTitle'),
            description: isEditing
                ? `Modificando "${initialData?.name || 'proyecto'}"`
                : t('description'),
            size: "md",
            footer: {
                submitLabel: isLoading
                    ? (isEditing ? t('saving') : t('creating'))
                    : (isEditing ? t('save') : t('createTitle')),
            }
        });
    }, [isEditing, isLoading, setPanelMeta, t, initialData?.name]);

    // Controlled states
    const [name, setName] = useState(initialData?.name || "");
    const [status, setStatus] = useState(initialData?.status || "active");
    const [projectTypeId, setProjectTypeId] = useState(
        initialData?.project_type_id || types.find(x => x.name === initialData?.project_type_name)?.id || ""
    );
    const [projectModalityId, setProjectModalityId] = useState(
        initialData?.project_modality_id || modalities.find(x => x.name === initialData?.project_modality_name)?.id || ""
    );
    const [color, setColor] = useState(initialData?.color || "#007AFF");

    // Image state — UploadField handles compression & upload
    const [coverImage, setCoverImage] = useState<UploadedFile | null>(
        initialData?.image_url
            ? { id: "existing", url: initialData.image_url, path: "", name: "", type: "image/*", size: 0, bucket: "social-assets" }
            : null
    );
    const [extractedPalette, setExtractedPalette] = useState<ImagePalette | null>(
        initialData?.image_palette || null
    );
    const uploadCleanupRef = useRef<(() => void) | null>(null);

    // Swap modal state
    const [showSwapModal, setShowSwapModal] = useState(false);

    // Detect if status is changing to 'active' from a non-active status
    const isChangingToActive = isEditing && status === 'active' && initialData?.status !== 'active';
    const isUnlimited = maxActiveProjects === -1;
    const isAtLimit = !isUnlimited && activeProjectsCount >= maxActiveProjects;
    const needsSwap = isChangingToActive && isAtLimit;

    // Semi-autonomous callback — delegates state update to the view
    const handleFormSuccess = (projectData: any) => {
        closePanel();
        onSuccess?.(projectData);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // If changing to active and at limit, show swap modal instead
        if (needsSwap) {
            setShowSwapModal(true);
            return;
        }

        await performSubmit();
    };

    const performSubmit = async () => {
        setIsLoading(true);
        const toastId = toast.loading(
            isEditing ? "Guardando cambios..." : "Creando proyecto...",
            { duration: Infinity }
        );

        try {
            // Client-side validation
            const trimmedName = name.trim();
            if (!trimmedName) {
                toast.error("El nombre del proyecto es obligatorio.", { id: toastId });
                setIsLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append('organization_id', organizationId);
            formData.append('name', trimmedName);
            formData.append('status', status);
            formData.append('color', color);

            if (projectTypeId) formData.append('project_type_id', projectTypeId);
            if (projectModalityId) formData.append('project_modality_id', projectModalityId);

            if (isEditing && initialData?.id) {
                formData.append('id', initialData.id);
            }

            // Image URL — already uploaded by UploadField
            if (coverImage?.url) {
                formData.append('image_url', coverImage.url);
            }

            // Color palette extracted from image
            if (extractedPalette) {
                formData.append('image_palette', JSON.stringify(extractedPalette));
            }

            const result = isEditing ? await updateProject(formData) : await createProject(formData);

            if (result.error) {
                // Handle the specific ACTIVE_LIMIT_REACHED error from backend
                if (result.error === "ACTIVE_LIMIT_REACHED") {
                    toast.dismiss(toastId);
                    setShowSwapModal(true);
                    setIsLoading(false);
                    return;
                }
                console.error("Project Action Error:", result.error);
                toast.error(result.error, { id: toastId });
            } else {
                toast.success(isEditing ? "¡Cambios guardados!" : "¡Proyecto creado!", { id: toastId });

                // Build optimistic data for the view
                // Create returns server data; edit builds from form fields
                const projectData = 'data' in result && result.data
                    ? result.data
                    : {
                        ...initialData,
                        name: name.trim(),
                        status,
                        color,
                        image_url: coverImage?.url || null,
                        image_palette: extractedPalette,
                        project_type_id: projectTypeId || null,
                        project_modality_id: projectModalityId || null,
                    };

                handleFormSuccess(projectData);
            }
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error("Error inesperado: " + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwapSuccess = (activatedId: string, deactivatedId: string) => {
        // After swap, the project is now active — build the updated data
        const projectData = {
            ...initialData,
            name: name.trim(),
            status: 'active',
            color,
            image_url: coverImage?.url || null,
            image_palette: extractedPalette,
            project_type_id: projectTypeId || null,
            project_modality_id: projectModalityId || null,
        };

        handleFormSuccess(projectData);
    };

    return (
        <>
            <form id={formId} onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
                {/* Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                        {/* Name: 50% width (TextField shared field) */}
                        <div className="md:col-span-6">
                            <TextField
                                value={name}
                                onChange={setName}
                                label={t('name')}
                                placeholder={t('namePlaceholder')}
                                required
                                autoFocus
                            />
                        </div>

                        {/* Status: 50% width */}
                        <div className="md:col-span-6">
                            <SelectField
                                value={status}
                                onChange={setStatus}
                                label={t('status')}
                                options={[
                                    { value: 'active', label: t('statusActive') },
                                    { value: 'inactive', label: t('statusInactive') },
                                    { value: 'completed', label: t('statusCompleted') },
                                ]}
                                tooltip="Los proyectos activos cuentan para el límite de tu plan. Marcá como Completado o Inactivo los que ya no estés trabajando para liberar espacio."
                            />
                        </div>

                        {/* Type: 50% width */}
                        <div className="md:col-span-6">
                            <SelectField
                                value={projectTypeId}
                                onChange={setProjectTypeId}
                                label={t('type')}
                                placeholder={t('typePlaceholder')}
                                options={types.map(type => ({ value: type.id, label: type.name }))}
                                emptyState={{ message: "Sin tipos.", linkText: "Crear en Configuración", linkHref: "/organization/projects" }}
                            />
                        </div>

                        {/* Modality: 50% width */}
                        <div className="md:col-span-6">
                            <SelectField
                                value={projectModalityId}
                                onChange={setProjectModalityId}
                                label={t('modality')}
                                placeholder={t('modalityPlaceholder')}
                                options={modalities.map(m => ({ value: m.id, label: m.name }))}
                                emptyState={{ message: "Sin modalidades.", linkText: "Crear en Configuración", linkHref: "/organization/projects" }}
                            />
                        </div>

                        {/* Image Upload: 100% width (UploadField shared field) */}
                        <div className="md:col-span-12">
                            <UploadField
                                mode="single-image"
                                label={t('mainImage')}
                                bucket="social-assets"
                                folderPath={`cover/projects/${organizationId}`}
                                compressionPreset="project-cover"
                                value={coverImage}
                                onChange={(file) => setCoverImage(file as UploadedFile | null)}
                                onPaletteExtracted={setExtractedPalette}
                                cleanupRef={uploadCleanupRef}
                                dropzoneLabel={t('dropzoneText')}
                                tooltip="Se usa como portada en las tarjetas de proyecto. En planes pagos, también personaliza los colores de la interfaz."
                            />

                            {/* Extracted Palette Preview */}
                            {extractedPalette && (
                                <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium text-muted-foreground">Paleta extraída</p>
                                        <p className="text-[11px] text-muted-foreground/70">Personaliza las tarjetas y la interfaz del proyecto</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {Object.entries(extractedPalette).map(([key, hex]) => (
                                            <div
                                                key={key}
                                                className="w-8 h-8 rounded-lg shadow-sm ring-1 ring-white/10"
                                                style={{ backgroundColor: hex }}
                                                title={`${key}: ${hex}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Color Picker: 100% width (ColorField shared field) */}
                        <div className="md:col-span-12">
                            <ColorField
                                value={color}
                                onChange={setColor}
                                label={t('projectColor')}
                                colors={PROJECT_COLORS}
                                allowNone={false}
                            />
                        </div>
                    </div>
                </div>
            </form>

            {/* Swap Modal — shown when user tries to change status to 'active' at limit */}
            {isEditing && initialData?.id && (
                <ProjectSwapModal
                    open={showSwapModal}
                    onOpenChange={setShowSwapModal}
                    projectToActivate={{
                        id: initialData.id,
                        name: name.trim() || initialData.name,
                    }}
                    activeProjects={activeProjects}
                    maxAllowed={maxActiveProjects}
                    onSwapSuccess={handleSwapSuccess}
                />
            )}
        </>
    );
}
