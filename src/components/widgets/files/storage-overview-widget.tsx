"use client";

import { useEffect, useState } from "react";
import { HardDrive, Image, Video, FileText, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmptyState } from "@/components/widgets/grid/widget-empty-state";
import { BentoCard } from "@/components/widgets/grid/bento-card";
import type { WidgetProps } from "@/components/widgets/grid/types";
import type { StorageStats } from "@/features/files/queries";
import { getStorageOverviewData, type StorageOverviewData } from "@/actions/widget-actions";

// ============================================================================
// STORAGE OVERVIEW WIDGET
// ============================================================================
// Unified widget: works in BOTH the files page (direct props) and the
// dashboard widget grid (via WidgetProps + initialData/autonomous fetch).
//
// Usage A — Files page (Server-rendered with direct props):
//   <StorageOverviewWidget stats={stats} maxStorageMb={500} folderCount={4} />
//
// Usage B — Dashboard grid (via registry, autonomous):
//   <StorageOverviewWidget initialData={prefetchedData} />
//   or just <StorageOverviewWidget /> (fetches its own data)
// ============================================================================

interface StorageOverviewWidgetProps extends Partial<WidgetProps> {
    /** Direct props — used when rendered in the files page */
    stats?: StorageStats;
    maxStorageMb?: number;
    folderCount?: number;
}

// -- Helpers ------------------------------------------------------------------

const FILE_TYPE_CONFIG: Record<string, { label: string; icon: typeof File }> = {
    image: { label: "Imágenes", icon: Image },
    video: { label: "Videos", icon: Video },
    pdf: { label: "PDFs", icon: FileText },
    doc: { label: "Documentos", icon: FileText },
    other: { label: "Otros", icon: File },
};

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

function formatStorageLimit(mb: number): string {
    if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
    return `${mb} MB`;
}

// -- Component ----------------------------------------------------------------

export function StorageOverviewWidget({
    stats: directStats,
    maxStorageMb: directMaxMb,
    folderCount: directFolderCount,
    initialData,
}: StorageOverviewWidgetProps) {
    const hasDirectProps = !!directStats;

    const [autonomousData, setAutonomousData] = useState<StorageOverviewData | null>(
        initialData ?? null
    );

    // Autonomous fetch: only when no direct props AND no initialData
    useEffect(() => {
        if (hasDirectProps || initialData) return;
        getStorageOverviewData().then(setAutonomousData);
    }, [hasDirectProps, initialData]);

    // Resolve final data
    const totalBytes = hasDirectProps ? directStats.totalBytes : autonomousData?.totalBytes ?? 0;
    const fileCount = hasDirectProps ? directStats.fileCount : autonomousData?.fileCount ?? 0;
    const byType = hasDirectProps ? directStats.byType : autonomousData?.byType ?? [];
    const maxStorageMb = hasDirectProps ? (directMaxMb ?? 500) : (autonomousData?.maxStorageMb ?? 500);

    // Loading state (only for autonomous mode)
    if (!hasDirectProps && autonomousData === null) {
        return (
            <BentoCard
                title="Almacenamiento"
                subtitle="Cargando..."
                icon={<HardDrive className="h-4 w-4" />}
            >
                <div className="space-y-3">
                    <Skeleton className="h-3 w-full rounded-full" />
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            </BentoCard>
        );
    }

    // Empty state (only for autonomous mode)
    if (!hasDirectProps && fileCount === 0) {
        return (
            <BentoCard
                title="Almacenamiento"
                subtitle="Sin archivos"
                icon={<HardDrive className="h-4 w-4" />}
            >
                <div className="h-full flex items-center justify-center">
                    <WidgetEmptyState
                        icon={HardDrive}
                        title="Sin archivos"
                        description="Subí archivos para ver el uso de almacenamiento"
                        href="/organization/files"
                        actionLabel="Ir a Documentación"
                    />
                </div>
            </BentoCard>
        );
    }

    // Computed values
    const maxBytes = maxStorageMb * 1024 * 1024;
    const usedPercent = maxBytes > 0 ? Math.min((totalBytes / maxBytes) * 100, 100) : 0;
    const percentLabel = usedPercent > 0 && usedPercent < 1 ? "<1" : usedPercent.toFixed(1);
    const isWarning = usedPercent >= 75 && usedPercent < 90;
    const isDanger = usedPercent >= 90;

    const progressColor = isDanger
        ? "bg-red-500"
        : isWarning
            ? "bg-amber-500"
            : "bg-primary";

    const progressGlow = isDanger
        ? "shadow-red-500/30"
        : isWarning
            ? "shadow-amber-500/30"
            : "shadow-primary/20";

    const typeBreakdown = byType.length > 0 ? (
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {byType.map((item) => {
                const config = FILE_TYPE_CONFIG[item.type] || FILE_TYPE_CONFIG.other;
                const Icon = config.icon;
                const typePercent = totalBytes > 0
                    ? ((item.bytes / totalBytes) * 100).toFixed(0)
                    : "0";
                return (
                    <div key={item.type} className="flex items-center gap-1.5 min-w-0">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {config.label}
                        </span>
                        <span className="text-xs font-medium tabular-nums">
                            {formatBytes(item.bytes)}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                            ({typePercent}%)
                        </span>
                    </div>
                );
            })}
        </div>
    ) : undefined;

    return (
        <BentoCard
            title="Almacenamiento"
            subtitle={`${formatBytes(totalBytes)} de ${formatStorageLimit(maxStorageMb)} usados`}
            icon={<HardDrive className="h-4 w-4" />}
            footer={typeBreakdown}
            className={hasDirectProps ? "h-auto" : undefined}
        >
            {/* Progress bar + stats — fills available space */}
            <div className="flex items-center gap-4 h-full">
                {/* Progress bar */}
                <div className="flex-1 min-w-0">
                    <div className="relative h-3 w-full rounded-full bg-muted/50 overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-700 ease-out shadow-sm",
                                progressColor,
                                progressGlow
                            )}
                            style={{ width: `${Math.max(usedPercent, 0.5)}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <span className={cn(
                            "text-[11px] font-medium",
                            isDanger ? "text-red-500" : isWarning ? "text-amber-500" : "text-muted-foreground"
                        )}>
                            {percentLabel}% utilizado
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            {formatBytes(Math.max(maxBytes - totalBytes, 0))} disponibles
                        </span>
                    </div>
                </div>

                {/* File count — inline with progress */}
                <div className="text-center shrink-0 pl-2 border-l border-border/40">
                    <p className="text-2xl font-bold tabular-nums leading-tight">{fileCount.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground">Archivos</p>
                </div>
            </div>
        </BentoCard>
    );
}
