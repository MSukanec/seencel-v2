"use client";

/**
 * Projects — Project Form (Panel)
 * Hybrid Chip Form — Linear-inspired
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │ Header (icon + title + desc)    │ ← setPanelMeta
 * ├─────────────────────────────────┤
 * │ ChipRow: Status, Type, Modal.  │ ← Chips
 * │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
 * │ Name (borderless, prominent)    │ ← Main field
 * │ Image Upload                    │
 * │ Color Picker                    │
 * ├─────────────────────────────────┤
 * │ Footer (cancel + submit)        │ ← Panel footer
 * └─────────────────────────────────┘
 */

import { createProject, updateProject, checkActiveProjectLimit, getActiveProjectsForSwap } from "@/features/projects/actions";
import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { usePanel } from "@/stores/panel-store";
import { useFileUpload, type UploadedFile } from "@/hooks/use-file-upload";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { FormTextField } from "@/components/shared/forms/fields/form-text-field";
import { ProjectSwapModal } from "@/features/projects/components/project-swap-modal";
import { type Project } from "@/components/shared/forms/fields";

import {
    ChipRow,
    SelectChip,
    StatusChip,
    ColorChip,
    AddressChip,
} from "@/components/shared/chips";
import type { StatusOption } from "@/components/shared/chips";
import type { AddressData } from "@/components/shared/popovers";

import { ProjectType, ProjectModality } from "@/types/project";
import { toast } from "sonner";
import { Building, Layers, FolderCog, ImageIcon, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";


const STATUS_OPTIONS: StatusOption[] = [
    { value: "planning", label: "Planificación", variant: "info" },
    { value: "active", label: "Activo", variant: "warning" },
    { value: "inactive", label: "Inactivo", variant: "neutral" },
    { value: "completed", label: "Completado", variant: "positive" },
];

// ─── Types ───────────────────────────────────────────────

interface ProjectsProjectFormProps {
    mode: 'create' | 'edit';
    initialData?: any;
    organizationId: string;
    types?: ProjectType[];
    modalities?: ProjectModality[];
    onSuccess?: (project: any) => void;
    maxActiveProjects?: number;
    activeProjectsCount?: number;
    activeProjects?: Project[];
    formId?: string;
}

// ─── Component ───────────────────────────────────────────

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
    const { closePanel, setPanelMeta, completePanel } = usePanel();
    const [isLoading, setIsLoading] = useState(false);
    const t = useTranslations('Project.form');
    const isEditing = mode === 'edit';

    // ─── Self-resolved plan limits ───────────────────────
    const [resolvedMax, setResolvedMax] = useState(maxActiveProjects);
    const [resolvedCount, setResolvedCount] = useState(activeProjectsCount);
    const [resolvedActiveProjects, setResolvedActiveProjects] = useState<{ id: string; name: string; color: string | null; image_url: string | null }[]>(activeProjects as any[]);

    // Auto-fetch plan limits if not provided as props
    useEffect(() => {
        if (maxActiveProjects === -1 && activeProjectsCount === 0) {
            // Props weren't passed — resolve from server
            checkActiveProjectLimit(organizationId, isEditing ? initialData?.id : undefined).then(result => {
                if (result) {
                    setResolvedMax(result.max_allowed);
                    setResolvedCount(result.current_active_count);
                }
            });
            getActiveProjectsForSwap(organizationId, isEditing ? initialData?.id : undefined)
                .then(projects => {
                    console.log('[ProjectForm] Swap projects resolved:', projects?.length ?? 0);
                    setResolvedActiveProjects(projects);
                })
                .catch(err => {
                    console.error('[ProjectForm] Error fetching swap projects:', err);
                });
        }
    }, [organizationId, maxActiveProjects, activeProjectsCount, isEditing, initialData?.id]);

    // ─── Panel Meta ──────────────────────────────────────
    useEffect(() => {
        setPanelMeta({
            icon: Building,
            title: isEditing ? "Editar Proyecto" : t('createTitle'),
            description: isEditing
                ? `Modificando "${initialData?.name || 'proyecto'}"`
                : t('description'),
            size: "md",
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : t('createTitle'),
            }
        });
    }, [isEditing, setPanelMeta, t, initialData?.name]);

    // ─── Form state ──────────────────────────────────────
    const [name, setName] = useState(initialData?.name || "");
    const [code, setCode] = useState(initialData?.code || "");
    const [status, setStatus] = useState(initialData?.status || "planning");
    const [projectTypeId, setProjectTypeId] = useState(
        initialData?.project_type_id || types.find(x => x.name === initialData?.project_type_name)?.id || ""
    );
    const [projectModalityId, setProjectModalityId] = useState(
        initialData?.project_modality_id || modalities.find(x => x.name === initialData?.project_modality_name)?.id || ""
    );
    const [color, setColor] = useState(initialData?.color || "");
    const [addressData, setAddressData] = useState<AddressData | null>(
        initialData?.city || initialData?.address
            ? {
                address: initialData?.address || "",
                city: initialData?.city || "",
                state: initialData?.state || "",
                country: initialData?.country || "",
                zip_code: initialData?.zip_code || "",
                lat: initialData?.lat || 0,
                lng: initialData?.lng || 0,
                place_id: initialData?.place_id || "",
            }
            : null
    );

    // Image state
    const [coverImage, setCoverImage] = useState<UploadedFile | null>(
        initialData?.image_url
            ? { id: "existing", url: initialData.image_url, path: "", name: "", type: "image/*", size: 0, bucket: "social-assets" }
            : null
    );
    const uploadCleanupRef = useRef<(() => void) | null>(null);

    // ─── File Upload Logic ───────────────────────────────
    const {
        activeUploads,
        completedFiles,
        addFiles,
        removeFile,
        initFiles,
        clearAll,
    } = useFileUpload({
        bucket: "social-assets",
        folderPath: `cover/projects/${organizationId}`,
        maxSizeMB: 10,
        compressionPreset: "project-cover",
        onFilesChange: (files) => {
            setCoverImage(files.length > 0 ? files[files.length - 1] : null);
        },
    });

    // Expose cleanup
    useEffect(() => {
        if (uploadCleanupRef.current !== clearAll) {
            uploadCleanupRef.current = clearAll;
        }
        return () => { uploadCleanupRef.current = null; };
    }, [clearAll]);

    // Sync existing image on mount
    useEffect(() => {
        if (coverImage && completedFiles.length === 0) {
            initFiles([coverImage]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (files) => addFiles(files.slice(0, 1)),
        maxSize: 10 * 1024 * 1024,
        accept: { "image/*": [] },
        multiple: false,
    });

    const hasImage = completedFiles.length > 0;
    const isUploading = activeUploads.length > 0;

    // Swap modal state
    const [showSwapModal, setShowSwapModal] = useState(false);

    // ─── Chip options ────────────────────────────────────
    const typeChipOptions = useMemo(() =>
        types.map(t => ({
            value: t.id,
            label: t.name,
            icon: <Layers className="h-3.5 w-3.5 text-muted-foreground" />,
        })),
        [types]
    );

    const modalityChipOptions = useMemo(() =>
        modalities.map(m => ({
            value: m.id,
            label: m.name,
            icon: <FolderCog className="h-3.5 w-3.5 text-muted-foreground" />,
        })),
        [modalities]
    );

    // ─── Derived ─────────────────────────────────────────
    const effectiveMax = resolvedMax;
    const effectiveCount = resolvedCount;
    const isUnlimited = effectiveMax === -1;
    const isAtLimit = !isUnlimited && effectiveCount >= effectiveMax;
    // needsSwap applies to both create (active/planning) AND edit (changing to active)
    const isCreatingActive = !isEditing && (status === 'active' || status === 'planning');
    const isChangingToActive = isEditing && status === 'active' && initialData?.status !== 'active';
    const needsSwap = (isCreatingActive || isChangingToActive) && isAtLimit;

    const resetForm = () => {
        setName("");
        setCode("");
        setStatus("active");
        setProjectTypeId("");
        setProjectModalityId("");
        setColor("");
        setCoverImage(null);
    };

    // ─── Success handler ─────────────────────────────────
    const handleFormSuccess = (projectData: any) => {
        closePanel();
        onSuccess?.(projectData);
    };

    // ─── Submit ──────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (needsSwap) {
            // Fetch fresh swap projects to avoid race condition with mount-time useEffect
            const freshProjects = await getActiveProjectsForSwap(organizationId, isEditing ? initialData?.id : undefined);
            if (freshProjects.length > 0) {
                setResolvedActiveProjects(freshProjects);
            }
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
            const trimmedName = name.trim();
            if (!trimmedName) {
                toast.error("El nombre del proyecto es obligatorio.", { id: toastId });
                setIsLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append('organization_id', organizationId);
            formData.append('name', trimmedName);
            if (code.trim()) formData.append('code', code.trim());
            formData.append('status', status);
            formData.append('color', color);

            if (projectTypeId) formData.append('project_type_id', projectTypeId);
            if (projectModalityId) formData.append('project_modality_id', projectModalityId);

            // Location data
            if (addressData) {
                formData.append('address', addressData.address);
                formData.append('city', addressData.city);
                formData.append('state', addressData.state);
                formData.append('country', addressData.country);
                formData.append('zip_code', addressData.zip_code);
                formData.append('lat', String(addressData.lat));
                formData.append('lng', String(addressData.lng));
                formData.append('place_id', addressData.place_id);
            }

            if (isEditing && initialData?.id) {
                formData.append('id', initialData.id);
            }

            if (coverImage?.url) {
                formData.append('image_url', coverImage.url);
            }

            const result = isEditing ? await updateProject(formData) : await createProject(formData);

            if (result.error) {
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

                const projectData = 'data' in result && result.data
                    ? result.data
                    : {
                        ...initialData,
                        name: name.trim(),
                        status,
                        color,
                        image_url: coverImage?.url || null,
                        project_type_id: projectTypeId || null,
                        project_modality_id: projectModalityId || null,
                    };

                if (isEditing) {
                    handleFormSuccess(projectData);
                } else {
                    onSuccess?.(projectData);
                    completePanel(resetForm);
                }
            }
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error("Error inesperado: " + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwapSuccess = async (activatedId: string, deactivatedId: string) => {
        if (isEditing) {
            // Edit mode: swap already changed the status, just close
            const projectData = {
                ...initialData,
                name: name.trim(),
                status: 'active',
                color,
                image_url: coverImage?.url || null,
                project_type_id: projectTypeId || null,
                project_modality_id: projectModalityId || null,
            };
            handleFormSuccess(projectData);
        } else {
            // Create mode: after swap freed a slot, retry the submit
            setShowSwapModal(false);
            await performSubmit();
        }
    };

    // ─── Render ──────────────────────────────────────────
    return (
        <>
            <form id={formId} onSubmit={handleSubmit} className="flex flex-col flex-1">
                {/* ── Chips: Metadata ───────────────────────── */}
                <ChipRow>
                    <StatusChip
                        value={status}
                        onChange={setStatus}
                        options={STATUS_OPTIONS}
                    />
                    {typeChipOptions.length > 0 && (
                        <SelectChip
                            value={projectTypeId}
                            onChange={setProjectTypeId}
                            options={typeChipOptions}
                            icon={<Layers className="h-3.5 w-3.5 text-muted-foreground" />}
                            emptyLabel="Tipo"
                            searchPlaceholder="Buscar tipo..."
                            popoverWidth={220}
                            manageRoute={{ pathname: "/organization/projects/settings" }}
                            manageLabel="Gestionar tipos"
                        />
                    )}
                    {modalityChipOptions.length > 0 && (
                        <SelectChip
                            value={projectModalityId}
                            onChange={setProjectModalityId}
                            options={modalityChipOptions}
                            icon={<FolderCog className="h-3.5 w-3.5 text-muted-foreground" />}
                            emptyLabel="Modalidad"
                            searchPlaceholder="Buscar modalidad..."
                            popoverWidth={220}
                            manageRoute={{ pathname: "/organization/projects/settings" }}
                            manageLabel="Gestionar modalidades"
                        />
                    )}
                    <AddressChip
                        value={addressData}
                        onChange={setAddressData}
                    />
                    <ColorChip
                        value={color}
                        onChange={setColor}
                    />
                </ChipRow>

                {/* ── Hero: Name ────────────────────────────── */}
                <FormTextField
                    variant="hero"
                    value={name}
                    onChange={setName}
                    placeholder={t('namePlaceholder')}
                    autoFocus
                />

                {/* ── Code (secondary field below hero) ──────── */}
                <div
                    className="-mx-5 px-5 py-2.5 border-b border-border/20"
                    style={{ background: "color-mix(in oklch, var(--sidebar), black 10%)" }}
                >
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Código (ej: PRY-001)"
                        className="w-full bg-transparent text-sm font-medium text-foreground/80 placeholder:text-muted-foreground/30 outline-none border-none"
                    />
                </div>

                {/* ── Body: Fields ──────────────────────────── */}
                {/* ── Cover Image (Hero) ─────────────────────── */}
                <div className="-mx-5 mt-4">
                    {isUploading ? (
                        <div className="flex items-center justify-center gap-2 py-8 bg-muted/30">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Subiendo imagen...</span>
                        </div>
                    ) : hasImage ? (
                        <div className="group relative w-full aspect-[16/7] overflow-hidden cursor-pointer" {...getRootProps()}>
                            <input {...getInputProps()} />
                            <Image
                                src={completedFiles[completedFiles.length - 1].url}
                                alt="Portada del proyecto"
                                fill
                                className="object-cover"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(completedFiles[completedFiles.length - 1].id);
                                    }}
                                    className="p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            {...getRootProps()}
                            className={cn(
                                "relative w-full aspect-[16/7] overflow-hidden cursor-pointer transition-all group/dropzone",
                                "mx-4 rounded-lg border border-dashed border-border/50 group-hover/dropzone:border-border/70",
                                isDragActive ? "bg-primary/5 border-primary/30" : "bg-transparent"
                            )}
                            style={{ width: "calc(100% - 2rem)" }}
                        >
                            <input {...getInputProps()} />
                            {/* Soft ambient glow — ethereal, diffused */}
                            <div
                                className="absolute inset-0 opacity-[0.025] group-hover/dropzone:opacity-[0.05] transition-opacity duration-500"
                                style={{
                                    background: `
                                        radial-gradient(ellipse 80% 60% at 50% 50%, currentColor 0%, transparent 70%),
                                        radial-gradient(ellipse 40% 80% at 20% 60%, currentColor 0%, transparent 60%),
                                        radial-gradient(ellipse 40% 80% at 80% 40%, currentColor 0%, transparent 60%)
                                    `,
                                }}
                            />
                            {/* Center content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                                <ImageIcon className="h-8 w-8 text-muted-foreground/15 group-hover/dropzone:text-muted-foreground/30 transition-colors duration-300" />
                                <span className="text-xs text-muted-foreground/15 group-hover/dropzone:text-muted-foreground/30 transition-colors duration-300">
                                    Agregar portada
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </form>

            {/* Swap Modal — works in both create and edit mode */}
            <ProjectSwapModal
                open={showSwapModal}
                onOpenChange={setShowSwapModal}
                projectToActivate={{
                    id: isEditing ? initialData?.id : '__new__',
                    name: name.trim() || (isEditing ? initialData?.name : 'Nuevo proyecto'),
                }}
                activeProjects={resolvedActiveProjects as any[]}
                maxAllowed={effectiveMax}
                onSwapSuccess={handleSwapSuccess}
            />
        </>
    );
}
