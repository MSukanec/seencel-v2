"use client";

/**
 * Files Table Columns
 * Standard 19.0 - Column Factories for Files DataTable
 *
 * Columnas para la vista tabla de archivos.
 * Usa column factories estándar del sistema DataTable.
 * 
 * IMPORTANTE: Esta tabla recibe `FileTableRow` (datos flateados),
 * no `FileItem` directamente. El flateo se hace en el view con `flattenFileItem()`.
 */

import { type ColumnDef } from "@tanstack/react-table";
import { createTextColumn } from "@/components/shared/data-table/columns/text-column";
import { createDateColumn } from "@/components/shared/data-table/columns/date-column";
import { createEntityColumn } from "@/components/shared/data-table/columns/entity-column";
import { createProjectColumn } from "@/components/shared/data-table/columns/project-column";
import { FileItem } from "../types";
import {
    FileText,
    Image as ImageIcon,
    Film,
    FileSpreadsheet,
    Presentation,
    FileArchive,
    FileCode,
    File,
} from "lucide-react";

// ============================================================================
// HELPERS
// ============================================================================

function getFileCategory(fileType: string): string {
    if (fileType === "image" || fileType.startsWith("image/")) return "image";
    if (fileType === "video" || fileType.startsWith("video/")) return "video";
    if (fileType === "pdf" || fileType === "application/pdf") return "pdf";
    if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) return "spreadsheet";
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "presentation";
    if (fileType.includes("zip") || fileType.includes("rar") || fileType.includes("tar") || fileType.includes("7z") || fileType.includes("archive") || fileType.includes("compressed")) return "archive";
    if (fileType.includes("javascript") || fileType.includes("json") || fileType.includes("xml") || fileType.includes("html") || fileType.includes("css") || fileType.includes("typescript")) return "code";
    return "document";
}

function getFileIcon(fileType: string) {
    const category = getFileCategory(fileType);
    switch (category) {
        case "image": return ImageIcon;
        case "video": return Film;
        case "pdf": return FileText;
        case "spreadsheet": return FileSpreadsheet;
        case "presentation": return Presentation;
        case "archive": return FileArchive;
        case "code": return FileCode;
        default: return File;
    }
}

const FILE_CATEGORY_LABELS: Record<string, string> = {
    image: "Imagen",
    video: "Video",
    pdf: "PDF",
    spreadsheet: "Planilla",
    presentation: "Presentación",
    archive: "Comprimido",
    code: "Código",
    document: "Archivo",
};

function formatSize(bytes: number | undefined | null): string {
    if (!bytes || bytes === 0) return "—";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getExtension(fileName: string): string {
    const parts = fileName.split(".");
    return parts.length > 1 ? "." + parts[parts.length - 1].toUpperCase() : "";
}

function getSourceModule(item: FileItem): string {
    if (item.site_log_id) return "Bitácora";
    if (item.client_payment_id) return "Clientes";
    if (item.material_payment_id || item.material_purchase_id) return "Materiales";
    if (item.subcontract_payment_id) return "Subcontratos";
    if (item.general_cost_payment_id) return "Gastos Generales";
    if (item.labor_payment_id) return "Mano de Obra";
    if (item.partner_contribution_id || item.partner_withdrawal_id) return "Capital";
    if (item.pin_id) return "Marcadores";
    if (item.course_id) return "Cursos";
    if (item.forum_thread_id) return "Foro";
    if (item.testimonial_id) return "Testimonios";
    return "General";
}

// ============================================================================
// FLATTENED ROW TYPE
// ============================================================================

/** Row type con campos planos para compatibilidad con column factories */
export interface FileTableRow extends FileItem {
    /** Nombre del archivo sin extensión */
    file_name: string;
    /** Extensión del archivo */
    file_extension: string;
    /** Categoría del archivo */
    file_category: string;
    /** Tamaño formateado */
    file_size_display: string;
    /** Fecha de creación del archivo (ISO string) */
    file_created_at: string;
    /** Módulo de origen */
    source_module: string;
    /** Signed URL for thumbnail preview */
    file_signed_url: string | null;
    /** Nombre del proyecto (si aplica) */
    project_name: string | null;
    /** Color del proyecto */
    project_color: string | null;
    /** URL de imagen del proyecto */
    project_image_url: string | null;
}

/** Convierte FileItem → FileTableRow (flateo para column factories) */
export function flattenFileItem(
    item: FileItem,
    projectMap?: Map<string, { name: string; color?: string | null; image_url?: string | null }>
): FileTableRow {
    const project = item.project_id ? projectMap?.get(item.project_id) : null;
    return {
        ...item,
        file_name: item.media_files.file_name.replace(/\.[^/.]+$/, ""),
        file_extension: getExtension(item.media_files.file_name),
        file_category: getFileCategory(item.media_files.file_type),
        file_size_display: formatSize(item.media_files.file_size),
        file_created_at: item.media_files.created_at,
        source_module: getSourceModule(item),
        file_signed_url: item.media_files.signed_url || null,
        project_name: project?.name || null,
        project_color: project?.color || null,
        project_image_url: project?.image_url || null,
    };
}

// ============================================================================
// COLUMN DEFINITIONS
// ============================================================================

interface FilesColumnsOptions {
    projects?: { id: string; name: string; color?: string | null; image_url?: string | null }[];
    /** Callback when file name changes inline */
    onRename?: (row: FileTableRow, newName: string) => Promise<void> | void;
}

export function getFilesColumns(
    options: FilesColumnsOptions = {}
): ColumnDef<FileTableRow>[] {
    const { projects = [], onRename } = options;

    return [
        // 1. Nombre — ícono de tipo + nombre + extensión como subtitle
        createTextColumn<FileTableRow>({
            accessorKey: "file_name",
            title: "Nombre",
            size: 280,
            editable: !!onRename,
            onUpdate: onRename,
            editPlaceholder: "Nombre del archivo...",
            subtitle: (row) => row.file_extension,
            customRender: !onRename ? (_, row) => {
                const category = getFileCategory(row.media_files.file_type);
                const Icon = getFileIcon(row.media_files.file_type);
                const hasThumbnail = (category === "image" || category === "video") && row.file_signed_url;
                return (
                    <div className="flex items-center gap-2.5 overflow-hidden">
                        {hasThumbnail ? (
                            <img
                                src={row.file_signed_url!}
                                alt={row.file_name}
                                className="h-8 w-8 rounded-md object-cover shrink-0 border border-border/30"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-muted/80 shrink-0">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex flex-col overflow-hidden min-w-0">
                            <span className="text-sm font-medium truncate">{row.file_name}</span>
                            <span className="text-xs text-muted-foreground font-[450]">{row.file_extension}</span>
                        </div>
                    </div>
                );
            } : undefined,
        }),

        // 2. Proyecto (conditional — second column)
        ...(projects.length > 0 ? [
            createProjectColumn<FileTableRow>({
                accessorKey: "project_name",
                size: 140,
                getColor: (row) => row.project_color,
                getImageUrl: (row) => row.project_image_url,
                getProjectId: (row) => row.project_id || null,
            }),
        ] : []),

        // 3. Tipo — category label
        createEntityColumn<FileTableRow>({
            accessorKey: "file_category",
            title: "Tipo",
            size: 130,
            labels: FILE_CATEGORY_LABELS,
            icon: File,
        }),

        // 4. Tamaño — font-mono
        createTextColumn<FileTableRow>({
            accessorKey: "file_size_display",
            title: "Tamaño",
            size: 100,
            muted: true,
            fillWidth: false,
        }),

        // 5. Fecha — standard date column
        createDateColumn<FileTableRow>({
            accessorKey: "file_created_at",
            title: "Fecha",
            showAvatar: false,
            relativeMode: "today-only",
            size: 130,
        }),

        // 6. Origen — module label
        createTextColumn<FileTableRow>({
            accessorKey: "source_module",
            title: "Origen",
            size: 130,
            fillWidth: false,
        }),
    ];
}
