"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Image as ImageIcon, Video, FileText, File, Play, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { BentoCard } from "@/components/widgets/grid/bento-card";
import { WidgetEmptyState } from "@/components/widgets/grid/widget-empty-state";
import type { WidgetProps } from "@/components/widgets/grid/types";
import { getRecentFiles, type RecentFileItem } from "@/actions/widget-actions";
import { useActiveProjectId } from "@/stores/layout-store";

// ============================================================================
// RECENT FILES WIDGET (Mini Gallery)
// ============================================================================
// Configurable widget that shows a mini gallery of recent files.
// Config options:
//   - fileType: 'all' | 'image' | 'video' | 'pdf' | 'document'
//   - scope: 'organization' | projectId (UUID)
//
// Layout adapts to container size:
//   - Columns: auto-fill based on width (min ~100px per cell)
//   - Rows: auto-fill based on height
//   - Cells stretch to fill ALL available space (not square)
// ============================================================================

// -- Constants ----------------------------------------------------------------

/** Minimum cell width to calculate columns */
const MIN_CELL_WIDTH = 100;
/** Max items to fetch — widget is a preview, full gallery is in Documentación */
const MAX_ITEMS = 12;

// -- Helpers ------------------------------------------------------------------

const FILE_TYPE_LABELS: Record<string, string> = {
    all: "Archivos",
    media: "Fotos y Videos",
    image: "Fotos",
    video: "Videos",
    pdf: "PDFs",
    document: "Documentos",
};

function getFileCategory(fileType: string): string {
    if (fileType === "image" || fileType.startsWith("image/")) return "image";
    if (fileType === "video" || fileType.startsWith("video/")) return "video";
    if (fileType === "pdf" || fileType === "application/pdf") return "pdf";
    return "document";
}

function getFileIconConfig(fileType: string) {
    const cat = getFileCategory(fileType);
    switch (cat) {
        case "image": return { icon: ImageIcon, color: "text-blue-400" };
        case "video": return { icon: Video, color: "text-purple-400" };
        case "pdf": return { icon: FileText, color: "text-red-400" };
        default: return { icon: File, color: "text-muted-foreground" };
    }
}

// -- Hook: measure container and calculate grid dimensions --------------------

function useAdaptiveGrid() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [grid, setGrid] = useState({ cols: 3, rows: 2, ready: false });

    const measure = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const { width, height } = el.getBoundingClientRect();
        if (width === 0 || height === 0) return;

        // Columns: as many as fit at MIN_CELL_WIDTH, minimum 3
        const cols = Math.max(3, Math.floor(width / MIN_CELL_WIDTH));

        // Rows: divide available height by an ideal cell height
        // Ideal cell height = width / cols (to keep some proportion)
        const idealCellH = width / cols;
        const rows = Math.max(1, Math.floor(height / idealCellH));

        setGrid(prev => {
            if (prev.cols === cols && prev.rows === rows && prev.ready) return prev;
            return { cols, rows, ready: true };
        });
    }, []);

    useEffect(() => {
        measure();
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [measure]);

    return { containerRef, ...grid };
}

// -- Component ----------------------------------------------------------------

export function RecentFilesWidget({ config, initialData }: WidgetProps) {
    const fileType = config?.fileType || "all";
    const configScope = config?.scope || "organization";
    const activeProjectId = useActiveProjectId();

    // Use activeProjectId as scope override when a project is selected
    const effectiveScope = activeProjectId || configScope;

    const [files, setFiles] = useState<RecentFileItem[] | null>(
        initialData ?? null
    );
    const isFirstRender = useRef(true);
    const { containerRef, cols, rows, ready } = useAdaptiveGrid();

    // Fetch on mount + re-fetch when config or project context changes
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            if (!activeProjectId && initialData) return;
        }
        setFiles(null);
        getRecentFiles(fileType, effectiveScope, MAX_ITEMS).then(setFiles);
    }, [fileType, effectiveScope, initialData, activeProjectId]);

    const subtitle = FILE_TYPE_LABELS[fileType] || "Archivos";
    const visibleCount = cols * rows;

    // Loading
    if (files === null) {
        return (
            <BentoCard
                title="Galería"
                subtitle={`Cargando ${subtitle.toLowerCase()}...`}
                icon={<FolderOpen className="h-4 w-4" />}
            >
                <div ref={containerRef} className="h-full w-full overflow-hidden">
                    <div
                        className="grid gap-1 h-full w-full"
                        style={{
                            gridTemplateColumns: `repeat(${cols}, 1fr)`,
                            gridTemplateRows: `repeat(${rows}, 1fr)`,
                        }}
                    >
                        {Array.from({ length: visibleCount }).map((_, i) => (
                            <Skeleton key={i} className="rounded-md w-full h-full" />
                        ))}
                    </div>
                </div>
            </BentoCard>
        );
    }

    // Empty
    if (files.length === 0) {
        return (
            <BentoCard
                title="Galería"
                subtitle={`Sin ${subtitle.toLowerCase()}`}
                icon={<FolderOpen className="h-4 w-4" />}
            >
                <div className="h-full flex items-center justify-center">
                    <WidgetEmptyState
                        icon={FolderOpen}
                        title={`Sin ${subtitle.toLowerCase()}`}
                        description={activeProjectId
                            ? "No hay archivos subidos para este proyecto"
                            : "Subí archivos para verlos aquí"
                        }
                        href="/organization/files"
                        actionLabel="Ir a Documentación"
                    />
                </div>
            </BentoCard>
        );
    }

    const visibleFiles = files.slice(0, visibleCount);

    return (
        <BentoCard
            title="Galería"
            subtitle={`${files.length} ${subtitle.toLowerCase()} recientes`}
            icon={<FolderOpen className="h-4 w-4" />}
        >
            <div ref={containerRef} className="h-full w-full overflow-hidden">
                {ready && (
                    <div
                        className="grid gap-1 h-full w-full"
                        style={{
                            gridTemplateColumns: `repeat(${cols}, 1fr)`,
                            gridTemplateRows: `repeat(${rows}, 1fr)`,
                        }}
                    >
                        {visibleFiles.map((file) => (
                            <GalleryThumbnail key={file.id} file={file} />
                        ))}
                    </div>
                )}
            </div>
        </BentoCard>
    );
}

// -- Thumbnail ----------------------------------------------------------------

function GalleryThumbnail({ file }: { file: RecentFileItem }) {
    const category = getFileCategory(file.file_type);
    const isImage = category === "image";
    const isVideo = category === "video";
    const iconConfig = getFileIconConfig(file.file_type);
    const IconComponent = iconConfig.icon;

    const handleClick = () => {
        const url = file.signed_url || file.url;
        if (url) window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <div
            className="relative rounded-md overflow-hidden group cursor-pointer bg-muted/30 w-full h-full"
            onClick={handleClick}
        >
            {isImage ? (
                <img
                    src={file.thumbnail_url || file.signed_url || file.url}
                    alt={file.file_name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                />
            ) : isVideo ? (
                <>
                    <video
                        src={file.signed_url || file.url}
                        muted
                        preload="metadata"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                            <Play className="h-3.5 w-3.5 text-white ml-0.5" fill="white" />
                        </div>
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted/50 group-hover:bg-muted/70 transition-colors">
                    <IconComponent className={cn("h-7 w-7", iconConfig.color)} />
                </div>
            )}
        </div>
    );
}
