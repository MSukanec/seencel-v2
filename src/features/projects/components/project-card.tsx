"use client";

import { Project } from "@/types/project";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { MapPin, ImageOff, Layers, FolderCog } from "lucide-react";
import Image from "next/image";
import { useRouter } from "@/i18n/routing";
import { StatusChip, SelectChip, ColorChip } from "@/components/shared/chips";
import type { StatusOption } from "@/components/shared/chips";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AddressPopoverContent, type AddressData } from "@/components/shared/popovers";
import { useState } from "react";

// ─── Status options (shared with form) ────────────────────
const STATUS_OPTIONS: StatusOption[] = [
    { value: "planning", label: "Planificación", variant: "info" },
    { value: "active", label: "Activo", variant: "warning" },
    { value: "inactive", label: "Inactivo", variant: "neutral" },
    { value: "completed", label: "Completado", variant: "positive" },
];

// ─── Location Popover Button (inline on card) ────────────
function LocationPopoverButton({
    project,
    location,
    onAddressChange,
}: {
    project: Project;
    location: string;
    onAddressChange: (data: AddressData) => void;
}) {
    const [open, setOpen] = useState(false);

    const currentAddress: AddressData | null = (project.city || project.address)
        ? {
            address: project.address || "",
            city: project.city || "",
            state: project.state || "",
            country: project.country || "",
            zip_code: project.zip_code || "",
            lat: project.lat || 0,
            lng: project.lng || 0,
            place_id: project.place_id || "",
        }
        : null;

    const handleSelect = (data: AddressData) => {
        onAddressChange(data);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className="text-xs text-white/70 mt-1 flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); }}
                >
                    <MapPin className="h-3 w-3" />
                    {location || "Agregar ubicación"}
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[340px] p-0"
                align="start"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                <AddressPopoverContent
                    currentValue={currentAddress}
                    onSelect={handleSelect}
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Types ───────────────────────────────────────────────

interface ProjectCardProps {
    project: Project;
    className?: string;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
    onUpdateProject?: (projectId: string, updates: Record<string, any>) => Promise<void>;
    /** Available types for the SelectChip popover */
    typeOptions?: { value: string; label: string }[];
    /** Available modalities for the SelectChip popover */
    modalityOptions?: { value: string; label: string }[];
}

/**
 * ProjectCard — Card with inline-editable chips.
 * Status chip overlays image (top-left). Type/Modality/Color chips in footer.
 */
export function ProjectCard({
    project,
    className,
    onEdit,
    onDelete,
    onUpdateProject,
    typeOptions = [],
    modalityOptions = [],
}: ProjectCardProps) {
    const router = useRouter();
    const palette = project.image_palette;
    const hasPalette = !!(palette && (palette.primary || palette.secondary || palette.background || palette.accent));

    // Project dot color
    const dotColor = (project.use_custom_color && project.custom_color_hex)
        || project.color
        || null;

    const location = [project.city, project.country].filter(Boolean).join(", ");

    // Construct image URL
    const imageUrl = project.image_bucket && project.image_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${project.image_bucket}/${project.image_path}`
        : project.image_url;

    const handleActionClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const detailHref = `/organization/projects/${project.id}` as any;

    // ── Palette-driven design tokens ──────────────────────────
    const swatchColors = hasPalette
        ? [palette.primary, palette.secondary, palette.accent, palette.background].filter(Boolean)
        : [];

    const footerBg = hasPalette && palette.accent
        ? `color-mix(in oklch, ${palette.accent} 30%, #1a1a1a)`
        : undefined;

    const gradientOverlay = hasPalette && palette.accent
        ? [
            `linear-gradient(to top,`,
            `color-mix(in oklch, ${palette.accent} 35%, #0a0a0a) 0%,`,
            `color-mix(in oklch, ${palette.accent} 20%, rgba(0,0,0,0.7)) 30%,`,
            `transparent 70%)`,
        ].join(" ")
        : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 35%, transparent 70%)";

    const cardBorder = hasPalette && palette.primary
        ? `1px solid color-mix(in oklch, ${palette.primary} 25%, transparent)`
        : undefined;

    // ── Chip handlers ────────────────────────────────────────
    const canEdit = !!onUpdateProject;

    const handleStatusChange = async (newStatus: string) => {
        if (onUpdateProject) {
            await onUpdateProject(project.id, { status: newStatus });
        }
    };

    const handleTypeChange = async (newTypeId: string) => {
        if (onUpdateProject) {
            await onUpdateProject(project.id, { project_type_name: newTypeId });
        }
    };

    const handleModalityChange = async (newModalityId: string) => {
        if (onUpdateProject) {
            await onUpdateProject(project.id, { project_modality_name: newModalityId });
        }
    };

    const handleColorChange = async (newColor: string) => {
        if (onUpdateProject) {
            await onUpdateProject(project.id, { color: newColor });
        }
    };

    const handleAddressChange = async (data: AddressData) => {
        if (onUpdateProject) {
            await onUpdateProject(project.id, {
                address: data.address,
                city: data.city,
                state: data.state,
                country: data.country,
                zip_code: data.zip_code,
                lat: data.lat,
                lng: data.lng,
                place_id: data.place_id,
            });
        }
    };

    return (
        <div
            className="block group cursor-pointer"
            onClick={() => router.push(detailHref)}
        >
            <Card
                className={cn(
                    "relative overflow-hidden rounded-xl shadow-lg",
                    "transition-all duration-300 ease-out",
                    "hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1",
                    !hasPalette && "border-0 bg-card",
                    hasPalette && "border-0",
                    className
                )}
                style={{
                    border: cardBorder,
                }}
            >
                {/* Hero Image Section */}
                <div className="relative h-72 w-full overflow-hidden">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={project.name}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                            <ImageOff className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div
                        className="absolute inset-0"
                        style={{ background: gradientOverlay }}
                    />

                    {/* ── Status Chip — top left over image ──────── */}
                    <div
                        className="absolute top-3 left-3 z-10 rounded-full bg-black/40 backdrop-blur-sm"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                        <StatusChip
                            value={project.status || "active"}
                            onChange={handleStatusChange}
                            options={STATUS_OPTIONS}
                            readOnly={!canEdit}
                        />
                    </div>

                    {/* Project Name + Color Dot */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
                            {project.name}
                        </h3>
                        {canEdit ? (
                            <LocationPopoverButton
                                project={project}
                                location={location}
                                onAddressChange={handleAddressChange}
                            />
                        ) : (
                            location && (
                                <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {location}
                                </p>
                            )
                        )}
                    </div>
                </div>


                {/* ── Footer — Chips + Actions ──────────────── */}
                <div
                    className="px-3 py-2.5 flex items-center justify-between text-white [&_svg]:text-white"
                    style={{
                        backgroundColor: footerBg,
                    }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                    <div className="flex flex-wrap gap-1.5 flex-1">
                        {/* Type Chip */}
                        {(project.project_type_name) && (
                            <SelectChip
                                value={project.project_type_name || ""}
                                onChange={handleTypeChange}
                                options={typeOptions.map(o => ({
                                    ...o,
                                    icon: <Layers className="h-3.5 w-3.5 text-muted-foreground" />,
                                }))}
                                icon={<Layers className="h-3.5 w-3.5 text-muted-foreground" />}
                                emptyLabel={project.project_type_name || "Tipo"}
                                readOnly={!canEdit || typeOptions.length === 0}
                                popoverWidth={200}
                            />
                        )}
                        {/* Modality Chip */}
                        {(project.project_modality_name) && (
                            <SelectChip
                                value={project.project_modality_name || ""}
                                onChange={handleModalityChange}
                                options={modalityOptions.map(o => ({
                                    ...o,
                                    icon: <FolderCog className="h-3.5 w-3.5 text-muted-foreground" />,
                                }))}
                                icon={<FolderCog className="h-3.5 w-3.5 text-muted-foreground" />}
                                emptyLabel={project.project_modality_name || "Modalidad"}
                                readOnly={!canEdit || modalityOptions.length === 0}
                                popoverWidth={200}
                            />
                        )}
                        {/* Color Chip */}
                        {project.color && (
                            <ColorChip
                                value={project.color}
                                onChange={handleColorChange}
                                readOnly={!canEdit}
                            />
                        )}
                    </div>

                </div>
            </Card>
        </div>
    );
}
