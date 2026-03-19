"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useMultiSelect } from "@/hooks/use-multi-select";
import { usePanel } from "@/stores/panel-store";
import { useActiveProjectId, useLayoutStore } from "@/stores/layout-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    FileText,
    Image as ImageIcon,
    Download,
    ExternalLink,
    Share2,
    Copy,
    Mail,
    Film,
    File,
    FolderOpen,
    Search,
    FileSpreadsheet,
    FileCode,
    FileArchive,
    Presentation,
    Play,
    Trash2,
    Upload,
    Table2,
    // Module icons
    BookOpen,
    DollarSign,
    Hammer,
    Users,
    Briefcase,
    Landmark,
    HardHat,
    MapPin,
    GraduationCap,
    MessageCircle,
    Building2,
    MoreHorizontal,
} from "lucide-react";
import { FileItem, SavedView, SavedViewFilters } from "../types";
import { PageHeaderActionPortal } from "@/components/layout";
import { EntityContextMenu } from "@/components/shared/entity-context-menu";
import { ToolbarCard, ViewsTabs, ActiveFiltersBar, ViewEditorBar, ToolbarFilter } from "@/components/shared/toolbar-controls";
import { DataTable } from "@/components/shared/data-table/data-table";
import { getFilesColumns, flattenFileItem, type FileTableRow } from "../tables/files-columns";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { deleteFile, createSavedView, updateSavedView, deleteSavedView } from "../actions";
import { parseDateFromDB } from "@/lib/timezone-data";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";



// Lightbox (YARL)
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download_Plugin from "yet-another-react-lightbox/plugins/download";
import Video from "yet-another-react-lightbox/plugins/video";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";

// YARL styles
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

// ============================================================================
// TYPES & HELPERS
// ============================================================================

type ViewMode = "explore" | "table";

/** Detect file category from MIME type or file_type field */
function getFileCategory(fileType: string): "image" | "video" | "pdf" | "spreadsheet" | "presentation" | "code" | "archive" | "document" {
    if (fileType === "image" || fileType.startsWith("image/")) return "image";
    if (fileType === "video" || fileType.startsWith("video/")) return "video";
    if (fileType === "pdf" || fileType === "application/pdf") return "pdf";
    if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) return "spreadsheet";
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "presentation";
    if (fileType.includes("zip") || fileType.includes("rar") || fileType.includes("tar") || fileType.includes("7z") || fileType.includes("archive") || fileType.includes("compressed")) return "archive";
    if (fileType.includes("javascript") || fileType.includes("json") || fileType.includes("xml") || fileType.includes("html") || fileType.includes("css") || fileType.includes("typescript")) return "code";
    return "document";
}

/** Get icon + color for file type */
function getFileIconConfig(fileType: string): { icon: React.ElementType; color: string; bgColor: string } {
    const category = getFileCategory(fileType);
    switch (category) {
        case "image": return { icon: ImageIcon, color: "text-blue-500", bgColor: "bg-blue-500/10" };
        case "video": return { icon: Film, color: "text-pink-500", bgColor: "bg-pink-500/10" };
        case "pdf": return { icon: FileText, color: "text-red-500", bgColor: "bg-red-500/10" };
        case "spreadsheet": return { icon: FileSpreadsheet, color: "text-emerald-500", bgColor: "bg-emerald-500/10" };
        case "presentation": return { icon: Presentation, color: "text-orange-500", bgColor: "bg-orange-500/10" };
        case "archive": return { icon: FileArchive, color: "text-amber-500", bgColor: "bg-amber-500/10" };
        case "code": return { icon: FileCode, color: "text-violet-500", bgColor: "bg-violet-500/10" };
        default: return { icon: File, color: "text-gray-500", bgColor: "bg-gray-500/10" };
    }
}

function formatSize(bytes: number | undefined | null): string {
    if (!bytes || bytes === 0) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileUrl(file: { signed_url?: string; bucket: string; file_path: string }): string {
    if (file.signed_url) return file.signed_url;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return `${supabaseUrl}/storage/v1/object/public/${file.bucket}/${file.file_path}`;
}

/** Shared context menu actions for file items — used in both grid and table views */
function getFileContextActions() {
    return [
        {
            label: "Copiar link",
            icon: <Copy className="h-3.5 w-3.5" />,
            onClick: (data: FileTableRow | FileItem) => {
                const file = 'media_files' in data ? data.media_files : data;
                const url = getFileUrl(file as any);
                navigator.clipboard.writeText(url);
                toast.success("Link copiado al portapapeles");
            },
        },
        {
            label: "Enviar por WhatsApp",
            icon: <MessageCircle className="h-3.5 w-3.5" />,
            onClick: (data: FileTableRow | FileItem) => {
                const file = 'media_files' in data ? data.media_files : data;
                const url = getFileUrl(file as any);
                window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank");
            },
        },
        {
            label: "Enviar por mail",
            icon: <Mail className="h-3.5 w-3.5" />,
            onClick: (data: FileTableRow | FileItem) => {
                const mediaFiles = 'media_files' in data ? data.media_files : data;
                const url = getFileUrl(mediaFiles as any);
                const fileName = (mediaFiles as any).file_name || "archivo";
                window.open(`mailto:?subject=${encodeURIComponent(fileName)}&body=${encodeURIComponent(url)}`, "_blank");
            },
        },
        {
            label: "Abrir en nueva pestaña",
            icon: <ExternalLink className="h-3.5 w-3.5" />,
            onClick: (data: FileTableRow | FileItem) => {
                const file = 'media_files' in data ? data.media_files : data;
                window.open(getFileUrl(file as any), "_blank");
            },
        },
        {
            label: "Descargar",
            icon: <Download className="h-3.5 w-3.5" />,
            onClick: (data: FileTableRow | FileItem) => {
                const mediaFiles = 'media_files' in data ? data.media_files : data;
                const url = getFileUrl(mediaFiles as any);
                const fileName = (mediaFiles as any).file_name || "archivo";
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                a.click();
            },
        },
    ];
}

function formatFileDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const date = parseDateFromDB(dateStr);
    if (!date) return "";
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

/** Get file extension from filename */
function getExtension(fileName: string): string {
    const parts = fileName.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
}

// ============================================================================
// MODULE & CATEGORY LABELS
// ============================================================================

/** Determine source module from FK fields in media_links */
function getSourceModule(item: FileItem): string {
    if (item.site_log_id) return "sitelog";
    if (item.client_payment_id) return "clients";
    if (item.material_payment_id || item.material_purchase_id) return "materials";
    if (item.subcontract_payment_id) return "subcontracts";
    if (item.general_cost_payment_id) return "general_costs";
    if (item.labor_payment_id) return "labor";
    if (item.partner_contribution_id || item.partner_withdrawal_id) return "capital";
    if (item.pin_id) return "pins";
    if (item.course_id) return "courses";
    if (item.forum_thread_id) return "forum";
    if (item.testimonial_id) return "testimonials";
    if (item.project_id) return "project";
    return "general";
}

/** Spanish labels for source modules */
const MODULE_LABELS: Record<string, string> = {
    sitelog: "Bitácora",
    clients: "Pagos",
    materials: "Materiales",
    subcontracts: "Subcontratos",
    general_costs: "Gastos Generales",
    labor: "Mano de Obra",
    capital: "Capital",
    pins: "Marcadores",
    courses: "Cursos",
    forum: "Foro",
    testimonials: "Testimonios",
    project: "Proyecto",
    general: "General",
};

/** Icons for source modules */
const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    sitelog: BookOpen,
    clients: Users,
    materials: Hammer,
    subcontracts: Briefcase,
    general_costs: DollarSign,
    labor: HardHat,
    capital: Landmark,
    pins: MapPin,
    courses: GraduationCap,
    forum: MessageCircle,
    testimonials: Users,
    project: Building2,
    general: FolderOpen,
};

/** Spanish labels for category field */
const CATEGORY_LABELS: Record<string, string> = {
    document: "Archivo",
    photo: "Foto",
    other: "Otro",
    general: "General",
    technical: "Técnico",
    financial: "Financiero",
    legal: "Legal",
    course_cover: "Portada",
    instructor_photo: "Instructor",
    module_image: "Módulo",
    section_background: "Fondo",
    testimonial_logo: "Logo",
    testimonial_avatar: "Avatar",
    project_photo: "Foto de Proyecto",
    og_image: "Imagen OG",
    client_gallery: "Galería",
    forum_attachment: "Adjunto",
    inspiration_pin: "Inspiración",
};

/** Get translated label for a category */
function getCategoryLabel(category: string | null | undefined): string {
    if (!category) return "";
    return CATEGORY_LABELS[category] || category;
}

/** Get translated label for a module */
function getModuleLabel(module: string): string {
    return MODULE_LABELS[module] || module;
}



// ============================================================================
// FILE CARD (Grid / Masonry)
// ============================================================================

interface FileCardProps {
    item: FileItem;
    onClick: () => void;
    onDelete?: (item: FileItem) => void;
    projectName?: string | null;
    projectColor?: string | null;
}

function FileCard({ item, onClick, onDelete, projectName, projectColor }: FileCardProps) {
    const file = item.media_files;
    const category = getFileCategory(file.file_type);
    const isImage = category === "image";
    const isVideo = category === "video";
    const isPdf = category === "pdf";
    const url = getFileUrl(file);
    const iconConfig = getFileIconConfig(file.file_type);
    const IconComponent = iconConfig.icon;
    const extension = getExtension(file.file_name);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVideoHovered, setIsVideoHovered] = useState(false);

    const handleVideoHover = useCallback(() => {
        setIsVideoHovered(true);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => { });
        }
    }, []);

    const handleVideoLeave = useCallback(() => {
        setIsVideoHovered(false);
        if (videoRef.current) {
            videoRef.current.pause();
        }
    }, []);

    return (
        <div
            className="group relative overflow-hidden rounded-xl border border-border/50 hover:border-border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer aspect-square"
            onClick={onClick}
            onMouseEnter={isVideo ? handleVideoHover : undefined}
            onMouseLeave={isVideo ? handleVideoLeave : undefined}
        >
            {/* Full-bleed thumbnail */}
            {isImage ? (
                <img
                    src={url}
                    alt={file.file_name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
            ) : isVideo ? (
                <>
                    <video
                        ref={videoRef}
                        src={url}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Play overlay */}
                    <div className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 z-10",
                        isVideoHovered ? "opacity-0" : "opacity-100"
                    )}>
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                            <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
                        </div>
                    </div>
                </>
            ) : isPdf ? (
                <div className={cn(
                    "absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3 bg-muted/50"
                )}>
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center",
                        iconConfig.bgColor
                    )}>
                        <IconComponent className={cn("h-7 w-7", iconConfig.color)} />
                    </div>
                    {extension && (
                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">
                            {extension}
                        </span>
                    )}
                </div>
            ) : (
                <div className={cn(
                    "absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3 bg-muted/50",
                    `bg-gradient-to-br from-transparent to-${iconConfig.color.replace('text-', '')}/5`
                )}>
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center",
                        iconConfig.bgColor
                    )}>
                        <IconComponent className={cn("h-7 w-7", iconConfig.color)} />
                    </div>
                    {extension && (
                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">
                            {extension}
                        </span>
                    )}
                </div>
            )}



            {/* Project Badge (top-left) — only visible on hover */}
            {projectName && (
                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Badge
                        variant="secondary"
                        className="backdrop-blur-md bg-black/40 text-white border-0 text-[10px] font-medium gap-1.5"
                    >
                        <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: projectColor || 'hsl(var(--primary))' }}
                        />
                        {projectName}
                    </Badge>
                </div>
            )}

            {/* Module Badge (top-right) */}
            <div className="absolute top-2 right-2 z-10">
                <Badge
                    variant="secondary"
                    className="backdrop-blur-md bg-black/40 text-white border-0 text-[10px] font-medium"
                >
                    {getModuleLabel(getSourceModule(item))}
                </Badge>
            </div>
        </div>
    );
}

// FileListItem is now imported from @/components/shared/list-item

// ============================================================================
// LIGHTBOX SLIDES BUILDER
// ============================================================================

function buildLightboxSlides(files: FileItem[]) {
    return files.map((item) => {
        const file = item.media_files;
        const url = getFileUrl(file);
        const category = getFileCategory(file.file_type);

        if (category === "image") {
            return {
                type: "image" as const,
                src: url,
                alt: file.file_name,
                title: file.file_name,
                download: { url, filename: file.file_name },
            };
        }

        if (category === "video") {
            return {
                type: "video" as const,
                sources: [{ src: url, type: file.file_type.startsWith("video/") ? file.file_type : "video/mp4" }],
                title: file.file_name,
                download: { url, filename: file.file_name },
            };
        }

        // PDF and other custom slides: use "image" type as base so YARL accepts them,
        // then detect via custom properties in render.slide callback
        if (category === "pdf") {
            return {
                type: "image" as const,
                src: url,
                title: file.file_name,
                download: { url, filename: file.file_name },
                customType: "pdf" as const,
            };
        }

        // Other: fallback card with download
        return {
            type: "image" as const,
            src: url,
            title: file.file_name,
            download: { url, filename: file.file_name },
            customType: "other" as const,
            fileType: file.file_type,
            fileSize: file.file_size,
        };
    });
}

// ============================================================================
// FILE GALLERY VIEW
// ============================================================================

interface FileGalleryProps {
    files: FileItem[];
    organizationId?: string;
    maxFileSizeMb?: number;
    onRefresh?: () => void;
    /** Org projects for badge display and filtering */
    projects?: { id: string; name: string; color?: string | null; image_url?: string | null }[];
    /** Saved views for this entity */
    savedViews?: SavedView[];
}

export function FileGallery({ files, organizationId, maxFileSizeMb = 50, onRefresh, projects = [], savedViews = [] }: FileGalleryProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("explore");
    const activeProjectId = useActiveProjectId();
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeViewId, setActiveViewId] = useState<string | null>(null);
    const [localViews, setLocalViews] = useState<SavedView[]>(savedViews);

    // Optimistic list for instant delete feedback
    const { optimisticItems: optimisticFiles, removeItem } = useOptimisticList({
        items: files,
        getItemId: (item) => item.id,
    });

    const { openPanel } = usePanel();

    // Open upload panel
    const handleUpload = useCallback(() => {
        openPanel('files-upload-form', {
            organizationId: organizationId!,
            maxFileSizeMb,
            projects,
            activeProjectId,
        });
    }, [openPanel, organizationId, maxFileSizeMb, projects, activeProjectId]);

    // Compute available modules from data
    const moduleFilterOptions = useMemo(() => {
        const moduleCounts = new Map<string, number>();
        for (const item of optimisticFiles) {
            const mod = getSourceModule(item);
            moduleCounts.set(mod, (moduleCounts.get(mod) || 0) + 1);
        }
        return Array.from(moduleCounts.entries())
            .sort(([, a], [, b]) => b - a)
            .map(([mod]) => ({
                label: getModuleLabel(mod),
                value: mod,
            }));
    }, [optimisticFiles]);

    // Type filter options
    const typeFilterOptions = [
        { label: "Imágenes", value: "images" },
        { label: "Archivos", value: "docs" },
        { label: "Videos", value: "videos" },
    ];

    // Filters (standard hook)
    const filters = useTableFilters({
        facets: [
            { key: "type", title: "Tipo", icon: FileText, options: typeFilterOptions },
            ...(moduleFilterOptions.length > 1
                ? [{ key: "module", title: "Herramienta", icon: FolderOpen, options: moduleFilterOptions }]
                : []),
        ],
        enableDateRange: true,
    });

    const filteredFiles = useMemo(() => optimisticFiles.filter((item) => {
        // Text search
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            if (!item.media_files.file_name.toLowerCase().includes(query)) {
                return false;
            }
        }
        // Type filter
        const typeFilter = filters.facetValues.type;
        if (typeFilter?.size > 0) {
            const fileType = item.media_files.file_type;
            let matchesType = false;
            if (typeFilter.has("images") && getFileCategory(fileType) === "image") matchesType = true;
            if (typeFilter.has("docs") && !["image", "video"].includes(getFileCategory(fileType))) matchesType = true;
            if (typeFilter.has("videos") && getFileCategory(fileType) === "video") matchesType = true;
            if (!matchesType) return false;
        }
        // Module filter
        const moduleFilter = filters.facetValues.module;
        if (moduleFilter?.size > 0) {
            const module = getSourceModule(item);
            if (!moduleFilter.has(module)) return false;
        }
        // Date range filter
        if (filters.dateRange?.from || filters.dateRange?.to) {
            const fileDate = item.media_files.created_at ? new Date(item.media_files.created_at) : null;
            if (!fileDate) return false;
            if (filters.dateRange.from && fileDate < filters.dateRange.from) return false;
            if (filters.dateRange.to) {
                const endOfTo = new Date(filters.dateRange.to);
                endOfTo.setHours(23, 59, 59, 999);
                if (fileDate > endOfTo) return false;
            }
        }
        // Project context filter (automatic from header selector)
        if (activeProjectId) {
            const pid = item.project_id;
            if (pid !== activeProjectId) return false;
        }
        return true;
    }), [optimisticFiles, filters.searchQuery, filters.facetValues, filters.dateRange, activeProjectId]);

    // Project name map for badges
    const projectNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        for (const p of projects) {
            map[p.id] = p.name;
        }
        return map;
    }, [projects]);

    // Project color map for badge backgrounds
    const projectColorMap = useMemo(() => {
        const map: Record<string, string> = {};
        for (const p of projects) {
            const color = (p as any).use_custom_color && (p as any).custom_color_hex
                ? (p as any).custom_color_hex
                : (p as any).color || '';
            if (color) map[p.id] = color;
        }
        return map;
    }, [projects]);



    // Multi-select (on filteredFiles)
    const multiSelect = useMultiSelect({
        items: filteredFiles,
        getItemId: (item) => item.id,
    });

    // Bulk delete handler
    const handleBulkDelete = useCallback(async () => {
        const ids = Array.from(multiSelect.selectedIds);
        if (ids.length === 0) return;

        multiSelect.clearSelection();

        // Optimistic: remove all selected from UI, server runs in background
        for (const id of ids) {
            removeItem(id, async () => {
                const result = await deleteFile(id);
                if (!result.success) {
                    toast.error(`Error al eliminar archivo`);
                }
            });
        }

        toast.success(`${ids.length} ${ids.length === 1 ? "archivo eliminado" : "archivos eliminados"}`);
    }, [multiSelect, removeItem]);

    // Bulk download handler
    const handleBulkDownload = useCallback(() => {
        const items = multiSelect.getSelectedItems();
        items.forEach(item => {
            const file = item.media_files;
            const url = file.signed_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/storage/v1/object/public/${file.bucket}/${file.file_path}`;
            const a = document.createElement("a");
            a.href = url;
            a.download = file.file_name;
            a.click();
        });
        multiSelect.clearSelection();
    }, [multiSelect]);

    // Lightbox slides
    const slides = useMemo(() => buildLightboxSlides(filteredFiles), [filteredFiles]);

    // View mode tabs (without "Carpetas")
    const viewModeOptions = [
        { label: "Explorar", value: "explore", icon: Search },
        { label: "Tabla", value: "table", icon: Table2 },
    ];

    // Table columns (memoized)
    const tableColumns = useMemo(
        () => getFilesColumns({ projects }),
        [projects]
    );

    // Flatten data for table (column factories need flat accessorKeys)
    const projectMap = useMemo(() => {
        const map = new Map<string, { name: string; color?: string | null; image_url?: string | null }>();
        for (const p of projects) map.set(p.id, p);
        return map;
    }, [projects]);

    const tableData = useMemo(
        () => filteredFiles.map(f => flattenFileItem(f, projectMap)),
        [filteredFiles, projectMap]
    );

    const handleDeleteRequest = useCallback((item: FileItem) => {
        setDeleteTarget(item);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteTarget) return;

        // Optimistic: remove immediately from UI
        removeItem(deleteTarget.id, async () => {
            try {
                const result = await deleteFile(deleteTarget.id);
                if (result.success) {
                    toast.success("Archivo eliminado");
                } else {
                    toast.error(result.error || "Error al eliminar");
                }
            } catch {
                toast.error("Error inesperado al eliminar");
            }
        });

        setDeleteTarget(null);
    }, [deleteTarget, removeItem]);

    // ─── Saved Views handlers ────────────────────────────────
    const serializeCurrentFilters = useCallback((): SavedViewFilters => {
        const facets: Record<string, string[]> = {};
        for (const [key, set] of Object.entries(filters.facetValues)) {
            if (set.size > 0) facets[key] = Array.from(set);
        }
        return {
            search: filters.searchQuery || undefined,
            facets: Object.keys(facets).length > 0 ? facets : undefined,
            dateRange: filters.dateRange ? {
                from: filters.dateRange.from?.toISOString(),
                to: filters.dateRange.to?.toISOString(),
            } : undefined,
        };
    }, [filters.searchQuery, filters.facetValues, filters.dateRange]);

    const applyViewFilters = useCallback((view: SavedView) => {
        // Clear all first
        filters.clearAll();
        // Apply saved filters
        const f = view.filters;
        if (f.search) filters.setSearchQuery(f.search);
        if (f.facets) {
            for (const [key, values] of Object.entries(f.facets)) {
                for (const val of values) filters.toggleFacet(key, val);
            }
        }
        if (f.dateRange) {
            filters.setDateRange({
                from: f.dateRange.from ? new Date(f.dateRange.from) : undefined,
                to: f.dateRange.to ? new Date(f.dateRange.to) : undefined,
            });
        }
        // Apply view mode
        if (view.view_mode && (view.view_mode === 'explore' || view.view_mode === 'table')) {
            setViewMode(view.view_mode);
        }
    }, [filters]);

    const handleSelectView = useCallback((viewId: string | null) => {
        setActiveViewId(viewId);
        if (viewId === null) {
            filters.clearAll();
            return;
        }
        const view = localViews.find(v => v.id === viewId);
        if (view) applyViewFilters(view);
    }, [localViews, filters, applyViewFilters]);

    const handleCreateView = useCallback(async (name: string) => {
        if (!organizationId) return;
        const currentFilters = serializeCurrentFilters();
        // Optimistic: add immediately with temp ID
        const tempId = `temp-${Date.now()}`;
        const tempView: SavedView = {
            id: tempId,
            organization_id: organizationId,
            name,
            entity_type: 'files',
            view_mode: viewMode,
            filters: currentFilters,
            is_default: false,
            position: localViews.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setLocalViews(prev => [...prev, tempView]);
        setActiveViewId(tempId);

        const result = await createSavedView({
            organizationId,
            name,
            entityType: 'files',
            viewMode,
            filters: currentFilters as Record<string, unknown>,
        });
        if (result.success && result.data) {
            // Replace temp with real
            setLocalViews(prev => prev.map(v => v.id === tempId ? {
                ...v,
                id: result.data!.id,
                created_at: result.data!.created_at,
                updated_at: result.data!.updated_at,
            } : v));
            setActiveViewId(result.data.id);
            toast.success(`Vista "${name}" creada`);
        } else {
            // Rollback
            setLocalViews(prev => prev.filter(v => v.id !== tempId));
            setActiveViewId(null);
            toast.error(result.error || 'Error al crear vista');
        }
    }, [organizationId, serializeCurrentFilters, viewMode, localViews]);

    const handleRenameView = useCallback(async (viewId: string, name: string) => {
        // Optimistic: rename immediately
        const previousName = localViews.find(v => v.id === viewId)?.name;
        setLocalViews(prev => prev.map(v => v.id === viewId ? { ...v, name } : v));

        const result = await updateSavedView(viewId, { name });
        if (result.success) {
            toast.success('Vista renombrada');
        } else {
            // Rollback
            if (previousName) {
                setLocalViews(prev => prev.map(v => v.id === viewId ? { ...v, name: previousName } : v));
            }
            toast.error(result.error || 'Error al renombrar');
        }
    }, [localViews]);

    const handleUpdateViewFilters = useCallback(async (viewId: string) => {
        const currentFilters = serializeCurrentFilters();
        // Optimistic: update immediately
        const previousView = localViews.find(v => v.id === viewId);
        setLocalViews(prev => prev.map(v => v.id === viewId ? { ...v, filters: currentFilters, view_mode: viewMode } : v));

        const result = await updateSavedView(viewId, {
            filters: currentFilters as Record<string, unknown>,
            viewMode,
        });
        if (result.success) {
            toast.success('Filtros actualizados');
        } else {
            // Rollback
            if (previousView) {
                setLocalViews(prev => prev.map(v => v.id === viewId ? previousView : v));
            }
            toast.error(result.error || 'Error al actualizar');
        }
    }, [serializeCurrentFilters, viewMode, localViews]);

    const handleDeleteView = useCallback(async (viewId: string) => {
        // Optimistic: remove immediately
        const deletedView = localViews.find(v => v.id === viewId);
        const deletedIndex = localViews.findIndex(v => v.id === viewId);
        setLocalViews(prev => prev.filter(v => v.id !== viewId));
        if (activeViewId === viewId) {
            setActiveViewId(null);
            filters.clearAll();
        }

        const result = await deleteSavedView(viewId);
        if (result.success) {
            toast.success('Vista eliminada');
        } else {
            // Rollback: restore view at original position
            if (deletedView) {
                setLocalViews(prev => {
                    const restored = [...prev];
                    restored.splice(deletedIndex, 0, deletedView);
                    return restored;
                });
            }
            toast.error(result.error || 'Error al eliminar');
        }
    }, [activeViewId, filters, localViews]);

    // === Header action (renders in all states) ===
    const headerAction = (
        <PageHeaderActionPortal>
            <Button onClick={handleUpload} size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Subir Archivo
            </Button>
        </PageHeaderActionPortal>
    );



    // === Editing view state ===
    const [editingView, setEditingView] = useState<{ id: string | null; name: string } | null>(null);

    const handleStartCreate = useCallback(() => {
        setEditingView({ id: null, name: "" });
    }, []);

    const handleStartEdit = useCallback((viewId: string) => {
        const view = localViews.find(v => v.id === viewId);
        if (view) {
            setEditingView({ id: viewId, name: view.name });
            // Apply view filters so user sees current state
            applyViewFilters(view);
            setActiveViewId(viewId);
        }
    }, [localViews, applyViewFilters]);

    const handleCancelEdit = useCallback(() => {
        setEditingView(null);
    }, []);

    const handleSaveEditedView = useCallback(() => {
        if (!editingView || !editingView.name.trim()) return;
        if (editingView.id === null) {
            // Creating new
            handleCreateView(editingView.name.trim());
        } else {
            // Updating existing — rename + update filters
            handleRenameView(editingView.id, editingView.name.trim());
            handleUpdateViewFilters(editingView.id);
        }
        setEditingView(null);
    }, [editingView, handleCreateView, handleRenameView, handleUpdateViewFilters]);

    // === Toolbar ===
    const toolbar = (
        <ToolbarCard
            left={
                <ViewsTabs
                    views={localViews}
                    activeViewId={activeViewId}
                    onSelectView={handleSelectView}
                    onStartCreate={handleStartCreate}
                    onRenameView={handleRenameView}
                    onStartEdit={handleStartEdit}
                    onUpdateFilters={handleUpdateViewFilters}
                    onDeleteView={handleDeleteView}
                />
            }
            filters={filters}
            searchPlaceholder="Buscar archivos..."
            display={{
                viewMode,
                onViewModeChange: (v) => setViewMode(v as ViewMode),
                viewModeOptions: viewModeOptions,
            }}
            bottom={
                <>
                    {editingView && (
                        <ViewEditorBar
                            name={editingView.name}
                            onNameChange={(name) => setEditingView(prev => prev ? { ...prev, name } : null)}
                            onCancel={handleCancelEdit}
                            onSave={handleSaveEditedView}
                        />
                    )}
                    {!editingView && (
                        <ActiveFiltersBar
                            filters={filters}
                            addFilterSlot={<ToolbarFilter filters={filters} variant="plus" />}
                            onSaveView={handleStartCreate}
                        />
                    )}
                </>
            }
        />
    );

    // === EARLY RETURN: Empty State (no files at all) ===
    if (optimisticFiles.length === 0) {
        return (
            <>
                {headerAction}
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={FolderOpen}
                        viewName="Archivos"
                        featureDescription="Los archivos incluyen todos los documentos, imágenes y recursos que subís a tu organización. Acá vas a encontrar todo lo que tu equipo comparte."
                        onAction={handleUpload}
                        actionLabel="Subir Archivo"
                        actionIcon={Upload}
                        docsPath="/docs/organizacion/archivos"
                    />
                </div>
            </>
        );
    }

    // === EARLY RETURN: Context Empty (project has no files but org does) ===
    if (filteredFiles.length === 0 && activeProjectId && !filters.hasActiveFilters) {
        return (
            <>
                {headerAction}
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="context-empty"
                        icon={FolderOpen}
                        viewName="archivos"
                        projectName={projectNameMap[activeProjectId] || "este proyecto"}
                        onAction={handleUpload}
                        actionLabel="Subir Archivo"
                        actionIcon={Upload}
                        onSwitchToOrg={() => useLayoutStore.getState().actions.setActiveProjectId(null)}
                    />
                </div>
            </>
        );
    }

    // === EARLY RETURN: No Results (filters active but no matches) ===
    if (filteredFiles.length === 0) {
        return (
            <>
                {headerAction}
                <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                    {toolbar}
                    <ViewEmptyState
                        mode="no-results"
                        icon={FolderOpen}
                        viewName="archivos"
                        filterContext="con esos filtros"
                        onResetFilters={filters.clearAll}
                    />
                </div>
            </>
        );
    }

    // === RENDER: Normal (has data) ===
    return (
        <div className="h-full flex flex-col">
            {headerAction}

            {/* Toolbar — inline ToolbarCard */}
            <div className="mb-4">
                {toolbar}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                {/* Explore Mode (Grid) */}
                        {viewMode === "explore" && (
                            <Card variant="inset">
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
                                    {filteredFiles.map((item, index) => {
                                        const fileUrl = getFileUrl(item.media_files);
                                        return (
                                            <EntityContextMenu
                                                key={item.id}
                                                data={item}
                                                onView={(item) => {
                                                    const idx = filteredFiles.findIndex(f => f.id === item.id);
                                                    if (idx >= 0) setLightboxIndex(idx);
                                                }}
                                                onDelete={handleDeleteRequest}
                                                customActions={getFileContextActions() as any}
                                            >
                                                <div>
                                                    <FileCard
                                                        item={item}
                                                        onClick={() => setLightboxIndex(index)}
                                                        onDelete={handleDeleteRequest}
                                                        projectName={item.project_id ? projectNameMap[item.project_id] : null}
                                                        projectColor={item.project_id ? projectColorMap[item.project_id] : null}
                                                    />
                                                </div>
                                            </EntityContextMenu>
                                        );
                                    })}
                                </div>
                            </Card>
                        )}



                        {/* Table Mode */}
                        {viewMode === "table" && (
                            <DataTable
                                columns={tableColumns}
                                data={tableData}
                                enableContextMenu
                                enableRowSelection
                                onView={(row: FileTableRow) => {
                                    const idx = filteredFiles.findIndex(f => f.id === row.id);
                                    if (idx >= 0) setLightboxIndex(idx);
                                }}
                                onDelete={(row: FileTableRow) => handleDeleteRequest(row as FileItem)}
                                customActions={getFileContextActions() as any}
                            />
                        )}
            </div>

            {/* Lightbox */}
            <Lightbox
                open={lightboxIndex >= 0}
                close={() => setLightboxIndex(-1)}
                index={lightboxIndex}
                slides={slides}
                plugins={[Zoom, Fullscreen, Counter, Download_Plugin, Video, Thumbnails]}
                carousel={{ finite: false }}
                zoom={{ maxZoomPixelRatio: 5, scrollToZoom: true }}
                thumbnails={{ position: "bottom", width: 80, height: 60 }}
                render={{
                    slide: ({ slide }) => {
                        const customSlide = slide as any;
                        // Custom PDF slide
                        if (customSlide.customType === "pdf") {
                            return (
                                <div className="flex flex-col items-center justify-center w-full h-full p-4">
                                    <iframe
                                        src={customSlide.src}
                                        className="w-full max-w-4xl rounded-lg shadow-2xl border border-white/10"
                                        style={{ height: "80vh" }}
                                        title={customSlide.title || "PDF"}
                                    />
                                    <p className="text-white/80 text-sm mt-3 font-medium">
                                        {customSlide.title}
                                    </p>
                                </div>
                            );
                        }

                        // Custom "other file" slide
                        if (customSlide.customType === "other") {
                            const iconCfg = getFileIconConfig(customSlide.fileType || "");
                            const Icon = iconCfg.icon;
                            return (
                                <div className="flex flex-col items-center justify-center text-white p-12">
                                    <div className={cn(
                                        "w-24 h-24 rounded-3xl flex items-center justify-center mb-6",
                                        iconCfg.bgColor
                                    )}>
                                        <Icon className={cn("h-12 w-12", iconCfg.color)} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 max-w-md text-center break-words">
                                        {customSlide.title || "Archivo"}
                                    </h3>
                                    <p className="text-white/50 mb-1 text-xs tracking-wider font-mono uppercase">
                                        {getExtension(customSlide.title || "")}
                                        {customSlide.fileSize ? ` · ${formatSize(customSlide.fileSize)}` : ""}
                                    </p>
                                    <p className="text-white/40 text-xs mb-8">
                                        Este tipo de archivo no se puede previsualizar
                                    </p>
                                    <Button asChild variant="secondary" size="lg">
                                        <a href={customSlide.src} target="_blank" rel="noopener noreferrer" download>
                                            <Download className="mr-2 h-4 w-4" />
                                            Descargar
                                        </a>
                                    </Button>
                                </div>
                            );
                        }

                        // Default (image/video): let YARL handle it
                        return undefined;
                    },
                }}
            />

            {/* Delete Confirmation */}
            <DeleteConfirmationDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar archivo?"
                description={<>Se eliminará <span className="font-medium text-foreground">{deleteTarget?.media_files.file_name}</span>. Esta acción no se puede deshacer.</>}
                isDeleting={isDeleting}
            />


        </div>
    );
}
