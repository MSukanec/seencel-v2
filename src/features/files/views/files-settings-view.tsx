"use client";

import { HardDrive, Image, Video, FileText, File, FolderOpen, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsSection } from "@/components/shared/settings-section";
import { useRouter } from "@/i18n/routing";
import type { StorageStats } from "@/features/files/queries";

// ============================================================================
// HELPERS
// ============================================================================

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

const FILE_TYPE_CONFIG: Record<string, { label: string; icon: typeof File; color: string }> = {
    image: { label: "Imágenes", icon: Image, color: "text-blue-500" },
    video: { label: "Videos", icon: Video, color: "text-pink-500" },
    pdf: { label: "PDFs", icon: FileText, color: "text-red-500" },
    doc: { label: "Documentos", icon: FileText, color: "text-amber-500" },
    other: { label: "Otros", icon: File, color: "text-muted-foreground" },
};

// ============================================================================
// FILES SETTINGS VIEW
// ============================================================================

interface FilesSettingsViewProps {
    stats: StorageStats;
    maxStorageMb: number;
}

export function FilesSettingsView({ stats, maxStorageMb }: FilesSettingsViewProps) {
    const { totalBytes, fileCount, byType } = stats;
    const router = useRouter();

    const isUnlimited = maxStorageMb <= 0;
    const maxBytes = isUnlimited ? 0 : maxStorageMb * 1024 * 1024;
    const usedPercent = !isUnlimited && maxBytes > 0 ? Math.min((totalBytes / maxBytes) * 100, 100) : 0;
    const percentLabel = usedPercent > 0 && usedPercent < 1 ? "<1" : usedPercent.toFixed(1);
    const isWarning = !isUnlimited && usedPercent >= 75 && usedPercent < 90;
    const isDanger = !isUnlimited && usedPercent >= 90;

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

    // Description text
    const description = isUnlimited
        ? `${formatBytes(totalBytes)} usados. Tu plan actual incluye almacenamiento ilimitado.`
        : `${formatBytes(totalBytes)} de ${formatStorageLimit(maxStorageMb)} usados. Gestioná el espacio de tu organización.`;

    // Actions — only show upgrade CTA when storage is limited
    const actions = isUnlimited ? undefined : [
        {
            label: "¿Necesitás más espacio?",
            icon: ArrowUpRight,
            variant: "secondary" as const,
            onClick: () => router.push("/organization/settings/billing"),
        },
    ];

    return (
        <SettingsSection
            title="Almacenamiento"
            description={description}
            icon={HardDrive}
            actions={actions}
        >
            <div className="space-y-4">
                {/* Progress bar — only when limited */}
                {!isUnlimited && (
                    <div className="px-1">
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
                        <div className="flex items-center justify-between mt-1.5">
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
                )}

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="cincel-island px-4 py-3 flex items-center gap-3">
                        <File className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-lg font-bold tabular-nums leading-tight">{fileCount.toLocaleString()}</p>
                            <p className="text-[11px] text-muted-foreground">Archivos</p>
                        </div>
                    </div>

                </div>

                {/* Type breakdown */}
                {byType.length > 0 && (
                    <div className="space-y-2.5">
                        {byType.map((item) => {
                            const config = FILE_TYPE_CONFIG[item.type] || FILE_TYPE_CONFIG.other;
                            const Icon = config.icon;
                            const typePercent = totalBytes > 0
                                ? ((item.bytes / totalBytes) * 100).toFixed(0)
                                : "0";
                            const barWidth = totalBytes > 0
                                ? Math.max((item.bytes / totalBytes) * 100, 1)
                                : 0;

                            return (
                                <div key={item.type} className="cincel-island px-4 py-3">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
                                        <span className="text-sm font-medium flex-1">{config.label}</span>
                                        <span className="text-xs font-medium tabular-nums">
                                            {formatBytes(item.bytes)}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
                                            {typePercent}%
                                        </span>
                                    </div>
                                    <div className="h-1 w-full rounded-full bg-muted/30 overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-500", progressColor)}
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </SettingsSection>
    );
}
