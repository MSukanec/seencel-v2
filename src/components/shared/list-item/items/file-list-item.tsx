"use client";

import { memo, useCallback } from "react";
import { ListItem } from "../list-item-base";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreHorizontal,
    Download,
    Share2,
    Copy,
    Mail,
    MessageCircle,
    ExternalLink,
    Trash2,
    FileText,
    Image as ImageIcon,
    Film,
    File,
    FileSpreadsheet,
    FileCode,
    FileArchive,
    Presentation,
    FolderInput,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseDateFromDB } from "@/lib/timezone-data";
import type { FileItem } from "@/features/files/types";

// ============================================================================
// HELPERS
// ============================================================================

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

function getFileIconConfig(fileType: string): { icon: React.ElementType; color: string; bgColor: string } {
    const category = getFileCategory(fileType);
    switch (category) {
        case "image": return { icon: ImageIcon, color: "text-blue-500", bgColor: "bg-blue-500/10" };
        case "video": return { icon: Film, color: "text-pink-500", bgColor: "bg-pink-500/10" };
        case "pdf": return { icon: FileText, color: "text-zinc-400", bgColor: "bg-zinc-400/10" };
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

function getExtension(fileName: string): string {
    const parts = fileName.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
}

/** Determine source module from FK fields */
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

// ============================================================================
// TYPES
// ============================================================================

export interface FileListItemProps {
    /** The file data to display */
    item: FileItem;
    /** Whether this item is selected (multi-select) */
    selected?: boolean;
    /** Callback when selection is toggled (multi-select) */
    onToggleSelect?: (id: string) => void;
    /** Callback when the item row is clicked (e.g. open lightbox) */
    onClick?: () => void;
    /** Callback when delete is requested */
    onDelete?: (item: FileItem) => void;
    /** Callback when "move to folder" is requested */
    onMoveToFolder?: (item: FileItem) => void;
    /** Project name to show as badge (org view only) */
    projectName?: string | null;
    /** Project color for badge background */
    projectColor?: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const FileListItem = memo(function FileListItem({
    item,
    selected = false,
    onToggleSelect,
    onClick,
    onDelete,
    onMoveToFolder,
    projectName,
    projectColor,
}: FileListItemProps) {
    // Memoize toggle handler for multi-select
    const handleToggle = useCallback(() => {
        onToggleSelect?.(item.id);
    }, [onToggleSelect, item.id]);
    const file = item.media_files;
    const isImage = getFileCategory(file.file_type) === "image";
    const isVideo = getFileCategory(file.file_type) === "video";
    const url = getFileUrl(file);
    const iconConfig = getFileIconConfig(file.file_type);
    const IconComponent = iconConfig.icon;
    const extension = getExtension(file.file_name);
    const sourceModule = getSourceModule(item);
    const categoryLabel = item.category ? CATEGORY_LABELS[item.category] || item.category : null;

    // Build description parts
    const descParts = [
        extension,
        formatSize(file.file_size),
        formatFileDate(file.created_at),
    ].filter(Boolean);

    return (
        <ListItem variant="card" selected={selected} onClick={onClick}>
            {/* Selection Checkbox */}
            {onToggleSelect && (
                <ListItem.Checkbox
                    checked={selected}
                    onChange={handleToggle}
                />
            )}

            {/* Leading: Thumbnail or icon */}
            <ListItem.Leading>
                <div className="h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-lg overflow-hidden bg-muted/50">
                    {isImage ? (
                        <img src={url} alt={file.file_name} className="h-full w-full object-cover" loading="lazy" />
                    ) : isVideo ? (
                        <video
                            src={url}
                            muted
                            preload="metadata"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className={cn("h-full w-full flex items-center justify-center", iconConfig.bgColor)}>
                            <IconComponent className={cn("h-5 w-5", iconConfig.color)} />
                        </div>
                    )}
                </div>
            </ListItem.Leading>

            {/* Content: Name + metadata + badges */}
            <ListItem.Content>
                <ListItem.Title>{file.file_name}</ListItem.Title>
                <ListItem.Description>
                    {descParts.join(" · ")}
                </ListItem.Description>
                <ListItem.Badges>
                    {projectName && (
                        <Badge
                            variant="secondary"
                            className="text-[10px] text-white border-0"
                            style={{ backgroundColor: projectColor || 'hsl(var(--primary))' }}
                        >
                            {projectName}
                        </Badge>
                    )}
                    {!projectName && item.project_id && (
                        <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">
                            Proyecto
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                        {MODULE_LABELS[sourceModule] || sourceModule}
                    </Badge>
                </ListItem.Badges>
            </ListItem.Content>

            {/* Actions: "..." dropdown */}
            <ListItem.Actions>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Acciones</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[180px]">
                        {/* Share section */}
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

                        {/* Open & Download */}
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(url, "_blank");
                            }}
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir en nueva pestaña
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <a
                                href={url}
                                download
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                            </a>
                        </DropdownMenuItem>

                        {/* Move to folder */}
                        {onMoveToFolder && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMoveToFolder(item);
                                    }}
                                >
                                    <FolderInput className="h-4 w-4 mr-2" />
                                    Mover a carpeta
                                </DropdownMenuItem>
                            </>
                        )}

                        {/* Delete */}
                        {onDelete && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(item);
                                    }}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </ListItem.Actions>
        </ListItem>
    );
});
