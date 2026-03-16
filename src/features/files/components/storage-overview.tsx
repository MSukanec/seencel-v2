"use client";

import { HardDrive, Image, Video, FileText, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentCard } from "@/components/cards";
import type { StorageStats } from "@/features/files/queries";

// ============================================================================
// STORAGE OVERVIEW — Card using ContentCard (standard card system)
// ============================================================================

interface StorageOverviewProps {
    stats: StorageStats;
    maxStorageMb: number;
}

const FILE_TYPE_CONFIG: Record<string, { label: string; icon: typeof File }> = {
    image: { label: "Imágenes", icon: Image },
    video: { label: "Videos", icon: Video },
    pdf: { label: "PDFs", icon: FileText },
    doc: { label: "Archivos", icon: FileText },
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

export function StorageOverview({ stats, maxStorageMb }: StorageOverviewProps) {
    const { totalBytes, fileCount, byType } = stats;

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
        <ContentCard
            title="Almacenamiento"
            description={`${formatBytes(totalBytes)} de ${formatStorageLimit(maxStorageMb)} usados`}
            icon={<HardDrive className="h-4 w-4" />}
            footer={typeBreakdown}
            compact
        >
            <div className="flex items-center gap-4">
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

                {/* File count */}
                <div className="text-center shrink-0 pl-2 border-l border-border/40">
                    <p className="text-2xl font-bold tabular-nums leading-tight">{fileCount.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground">Archivos</p>
                </div>
            </div>
        </ContentCard>
    );
}
