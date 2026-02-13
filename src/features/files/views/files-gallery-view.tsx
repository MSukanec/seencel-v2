"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { useMultiSelect } from "@/hooks/use-multi-select";
import { useModal } from "@/stores/modal-store";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    CalendarDays,
    Upload,
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
import { FileItem, Folder } from "../types";
import { FileListItem } from "@/components/shared/list-item";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { DateRangeFilter, DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { deleteFile } from "../actions";
import { FilesUploadForm } from "../forms/files-upload-form";
import { FilesFoldersView } from "./files-folders-view";
import { MoveToFolderDialog } from "../forms/move-to-folder-dialog";
import { parseDateFromDB } from "@/lib/timezone-data";
import { cn } from "@/lib/utils";



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

type ViewMode = "explore" | "folders" | "recent";

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
    clients: "Clientes",
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
    document: "Documento",
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
// DATE GROUPING HELPER
// ============================================================================

interface DateGroup {
    label: string;
    items: FileItem[];
}

function groupFilesByDate(files: FileItem[]): DateGroup[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const groups = new Map<string, FileItem[]>();
    const groupOrder: string[] = [];

    const addToGroup = (label: string, item: FileItem) => {
        if (!groups.has(label)) {
            groups.set(label, []);
            groupOrder.push(label);
        }
        groups.get(label)!.push(item);
    };

    for (const item of files) {
        const dateStr = item.media_files.created_at;
        const date = parseDateFromDB(dateStr);
        if (!date) {
            addToGroup("Sin fecha", item);
            continue;
        }

        const fileDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (fileDay.getTime() === today.getTime()) {
            addToGroup("Hoy", item);
        } else if (fileDay.getTime() === yesterday.getTime()) {
            addToGroup("Ayer", item);
        } else if (fileDay >= weekStart) {
            addToGroup("Esta semana", item);
        } else if (fileDay >= lastWeekStart) {
            addToGroup("Semana pasada", item);
        } else {
            // Group by month + year
            const monthLabel = date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
            const capitalizedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
            addToGroup(capitalizedLabel, item);
        }
    }

    return groupOrder.map((label) => ({
        label,
        items: groups.get(label)!,
    }));
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

            {/* Hover Overlay with actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-20">
                <div className="flex gap-2">
                    {/* Share Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors cursor-pointer">
                                <Share2 className="h-4 w-4 text-white" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" side="top" className="min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(url);
                                    toast.success("Link copiado al portapapeles");
                                }}
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank");
                                }}
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`mailto:?subject=${encodeURIComponent(file.file_name)}&body=${encodeURIComponent(url)}`, "_blank");
                                }}
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(url, "_blank");
                                }}
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Abrir en nueva pestaña
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Download */}
                    <a
                        href={url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors"
                    >
                        <Download className="h-4 w-4 text-white" />
                    </a>

                    {/* Delete */}
                    {onDelete && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item);
                            }}
                            className="w-10 h-10 rounded-full bg-red-500/30 backdrop-blur-md flex items-center justify-center border border-red-400/40 hover:bg-red-500/50 transition-colors cursor-pointer"
                        >
                            <Trash2 className="h-4 w-4 text-white" />
                        </div>
                    )}
                </div>
            </div>

            {/* Project Badge (top-left) */}
            {projectName && (() => {
                const initials = projectName.split(/\s+/).map(w => w[0]).join("").toUpperCase();
                return (
                    <div className="absolute top-2 left-2 z-10">
                        <Badge
                            variant="secondary"
                            className="backdrop-blur-md text-white border-0 text-[10px] font-medium"
                            style={{ backgroundColor: projectColor || 'hsl(var(--primary))' }}
                        >
                            <span className="sm:hidden">{initials}</span>
                            <span className="hidden sm:inline">{projectName}</span>
                        </Badge>
                    </div>
                );
            })()}

            {/* Module Badge (top-right) */}
            <div className="absolute top-2 right-2 z-10">
                <Badge
                    variant="secondary"
                    className="backdrop-blur-md bg-black/40 text-white border-0 text-[10px] font-medium"
                >
                    {getModuleLabel(getSourceModule(item))}
                </Badge>
            </div>

            {/* Date text (bottom-left) */}
            {formatFileDate(file.created_at) && (
                <div className="absolute bottom-2 left-2 z-10">
                    <span className="text-[10px] font-medium text-white/80 drop-shadow-md">
                        {formatFileDate(file.created_at)}
                    </span>
                </div>
            )}
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
    folders?: Folder[];
    organizationId?: string;
    maxFileSizeMb?: number;
    onRefresh?: () => void;
    /** Org projects for badge display and filtering */
    projects?: { id: string; name: string }[];
}

export function FileGallery({ files, folders = [], organizationId, maxFileSizeMb = 50, onRefresh, projects = [] }: FileGalleryProps) {
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
    const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);
    const [viewMode, setViewMode] = useState<ViewMode>("explore");
    const [searchQuery, setSearchQuery] = useState("");
    const activeProjectId = useActiveProjectId();
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [moveTarget, setMoveTarget] = useState<FileItem | null>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Optimistic list for instant delete feedback
    const { optimisticItems: optimisticFiles, removeItem } = useOptimisticList({
        items: files,
        getItemId: (item) => item.id,
    });

    const { openModal } = useModal();

    // Open upload modal
    const handleUpload = useCallback(() => {
        openModal(
            <FilesUploadForm organizationId={organizationId!} maxFileSizeMb={maxFileSizeMb} folders={folders} />,
            {
                title: "Subir Documentos",
                description: "Arrastrá o seleccioná los documentos que querés subir a tu organización.",
                size: "md",
            }
        );
    }, [openModal, organizationId, maxFileSizeMb]);

    // Debounced search (300ms)
    const debouncedSearch = useCallback((value: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearchQuery(value);
        }, 300);
    }, []);

    const filteredFiles = useMemo(() => optimisticFiles.filter((item) => {
        // Text search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!item.media_files.file_name.toLowerCase().includes(query)) {
                return false;
            }
        }
        // Type filter
        if (selectedTypes.size > 0) {
            const fileType = item.media_files.file_type;
            let matchesType = false;
            if (selectedTypes.has("images") && getFileCategory(fileType) === "image") matchesType = true;
            if (selectedTypes.has("docs") && !["image", "video"].includes(getFileCategory(fileType))) matchesType = true;
            if (selectedTypes.has("videos") && getFileCategory(fileType) === "video") matchesType = true;
            if (!matchesType) return false;
        }
        // Module filter
        if (selectedModules.size > 0) {
            const module = getSourceModule(item);
            if (!selectedModules.has(module)) return false;
        }
        // Date range filter
        if (dateRange?.from || dateRange?.to) {
            const fileDate = item.media_files.created_at ? new Date(item.media_files.created_at) : null;
            if (!fileDate) return false;
            if (dateRange.from && fileDate < dateRange.from) return false;
            if (dateRange.to) {
                const endOfTo = new Date(dateRange.to);
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
    }), [optimisticFiles, searchQuery, selectedTypes, selectedModules, activeProjectId, dateRange]);

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
                icon: MODULE_ICONS[mod] || MoreHorizontal,
            }));
    }, [optimisticFiles]);

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

        toast.success(`${ids.length} ${ids.length === 1 ? "documento eliminado" : "documentos eliminados"}`);
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

    // FacetedFilter options
    const typeFilterOptions = [
        { label: "Imágenes", value: "images", icon: ImageIcon },
        { label: "Documentos", value: "docs", icon: FileText },
        { label: "Videos", value: "videos", icon: Film },
    ];

    // View mode tabs
    const viewModeOptions = [
        { label: "Explorar", value: "explore", icon: Search },
        { label: "Carpetas", value: "folders", icon: FolderOpen },
        { label: "Recientes", value: "recent", icon: CalendarDays },
    ];

    const handleTypeSelect = (value: string) => {
        setSelectedTypes((prev) => {
            const next = new Set(prev);
            if (next.has(value)) next.delete(value);
            else next.add(value);
            return next;
        });
    };

    const handleModuleSelect = (value: string) => {
        setSelectedModules((prev) => {
            const next = new Set(prev);
            if (next.has(value)) next.delete(value);
            else next.add(value);
            return next;
        });
    };

    const hasFilters = searchQuery !== "" || selectedTypes.size > 0 || selectedModules.size > 0 || !!dateRange;

    const handleResetFilters = () => {
        setSearchQuery("");
        setSelectedTypes(new Set());
        setSelectedModules(new Set());
        setDateRange(undefined);
    };

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

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar - Portaled to Header */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={debouncedSearch}
                searchPlaceholder="Buscar documentos..."
                actions={[
                    {
                        label: "Subir Documento",
                        icon: Upload,
                        onClick: handleUpload,
                    },
                ]}
                selectedCount={multiSelect.selectedCount}
                onClearSelection={multiSelect.clearSelection}
                onSelectAll={multiSelect.selectAll}
                totalCount={filteredFiles.length}
                onBulkDelete={handleBulkDelete}
                bulkActions={
                    <>
                        <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleBulkDownload} className="gap-2">
                            <Download className="h-4 w-4" />
                            Descargar
                        </Button>
                    </>
                }
                leftActions={
                    <div className="flex items-center gap-2">
                        <ToolbarTabs
                            value={viewMode}
                            onValueChange={(v) => setViewMode(v as ViewMode)}
                            options={viewModeOptions}
                        />
                        <FacetedFilter
                            title="Tipo"
                            options={typeFilterOptions}
                            selectedValues={selectedTypes}
                            onSelect={handleTypeSelect}
                            onClear={() => setSelectedTypes(new Set())}
                        />
                        {moduleFilterOptions.length > 1 && (
                            <FacetedFilter
                                title="Módulo"
                                options={moduleFilterOptions}
                                selectedValues={selectedModules}
                                onSelect={handleModuleSelect}
                                onClear={() => setSelectedModules(new Set())}
                            />
                        )}
                        <DateRangeFilter
                            title="Fecha"
                            value={dateRange}
                            onChange={setDateRange}
                        />
                    </div>
                }
            />

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Empty state: no files at all (org-wide) */}
                {optimisticFiles.length === 0 ? (
                    <ViewEmptyState
                        mode="empty"
                        icon={FolderOpen}
                        viewName="Documentación"
                        featureDescription="La documentación incluye todos los documentos, imágenes y recursos que subís a tu organización. Acá vas a encontrar todo lo que tu equipo comparte."
                        onAction={handleUpload}
                        actionLabel="Subir Documento"
                        actionIcon={Upload}
                        docsPath="/docs/documentacion/introduccion"
                    />
                ) : filteredFiles.length === 0 && activeProjectId && !hasFilters ? (
                    /* Context empty: project has no files but org does */
                    <ViewEmptyState
                        mode="context-empty"
                        icon={FolderOpen}
                        viewName="documentos"
                        projectName={projectNameMap[activeProjectId] || "este proyecto"}
                        onAction={handleUpload}
                        actionLabel="Subir Documento"
                        actionIcon={Upload}
                        onSwitchToOrg={() => useLayoutStore.getState().actions.setActiveProjectId(null)}
                    />
                ) : filteredFiles.length === 0 ? (
                    /* No results: manual filters returned nothing */
                    <ViewEmptyState
                        mode="no-results"
                        icon={FolderOpen}
                        viewName="documentos"
                        filterContext="con esos filtros"
                        onResetFilters={handleResetFilters}
                    />
                ) : (
                    <>
                        {/* Explore Mode (Grid) */}
                        {viewMode === "explore" && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
                                {filteredFiles.map((item, index) => (
                                    <FileCard
                                        key={item.id}
                                        item={item}
                                        onClick={() => setLightboxIndex(index)}
                                        onDelete={handleDeleteRequest}
                                        projectName={item.project_id ? projectNameMap[item.project_id] : null}
                                        projectColor={item.project_id ? projectColorMap[item.project_id] : null}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Folders Mode */}
                        {viewMode === "folders" && (
                            <FilesFoldersView
                                folders={folders}
                                files={filteredFiles}
                                organizationId={organizationId!}
                                onOpenFile={(_item, index) => setLightboxIndex(index)}
                                onDeleteFile={handleDeleteRequest}
                                onMoveToFolder={setMoveTarget}
                                isSelected={multiSelect.isSelected}
                                onToggleSelect={multiSelect.toggle}
                                projectNameMap={projectNameMap}
                                projectColorMap={projectColorMap}
                            />
                        )}

                        {/* Recent Mode (grouped by date) */}
                        {viewMode === "recent" && (
                            <div className="space-y-6">
                                {groupFilesByDate(filteredFiles).map((group) => (
                                    <div key={group.label}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                            <h3 className="text-sm font-semibold text-muted-foreground">
                                                {group.label}
                                            </h3>
                                            <span className="text-xs text-muted-foreground/60">
                                                {group.items.length} {group.items.length === 1 ? "documento" : "documentos"}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {group.items.map((item) => {
                                                const globalIndex = filteredFiles.indexOf(item);
                                                return (
                                                    <FileListItem
                                                        key={item.id}
                                                        item={item}
                                                        selected={multiSelect.isSelected(item.id)}
                                                        onToggleSelect={multiSelect.toggle}
                                                        onClick={() => setLightboxIndex(globalIndex)}
                                                        onDelete={handleDeleteRequest}
                                                        onMoveToFolder={setMoveTarget}
                                                        projectName={item.project_id ? projectNameMap[item.project_id] : null}
                                                        projectColor={item.project_id ? projectColorMap[item.project_id] : null}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará <span className="font-medium text-foreground">{deleteTarget?.media_files.file_name}</span>.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Move to Folder Dialog */}
            <MoveToFolderDialog
                open={!!moveTarget}
                onOpenChange={(open) => !open && setMoveTarget(null)}
                file={moveTarget}
                folders={folders}
            />
        </div>
    );
}
