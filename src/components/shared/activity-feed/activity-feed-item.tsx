"use client";

/**
 * ActivityFeedItem — Linear-style activity feed item
 * 
 * Renders a single activity log as a natural language sentence:
 * hace 2 días · **Matías Sukanec** creó un proyecto **Colegio Elustondo**
 * 
 * Centralizado para reutilizar en:
 * - Configuración > Actividad (lista completa)
 * - Widgets de actividad en dashboards
 * - Detalle de proyecto / módulo
 */

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { moduleConfigs, actionConfigs, getActionVerb } from "@/config/audit-logs";
import { User } from "lucide-react";

// ─── Types ───────────────────────────────────────────────

export interface ActivityLogItem {
    id: string;
    action: string;
    target_table: string;
    target_id?: string | null;
    metadata?: Record<string, any> | null;
    created_at: string;
    full_name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
}

interface ActivityFeedItemProps {
    log: ActivityLogItem;
    /** Show avatar (default: true) */
    showAvatar?: boolean;
    /** Compact mode for widgets (smaller font, less padding) */
    compact?: boolean;
    /** Additional className */
    className?: string;
    /** Click handler */
    onClick?: (log: ActivityLogItem) => void;
}

// ─── Helpers ─────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

function getEntityName(metadata: Record<string, any> | null | undefined): string | null {
    if (!metadata) return null;
    if (metadata.name) return metadata.name;
    if (metadata.first_name || metadata.last_name) {
        return [metadata.first_name, metadata.last_name].filter(Boolean).join(" ");
    }
    if (metadata.title) return metadata.title;
    if (metadata.email) return metadata.email;
    return null;
}

function getTimeAgo(dateString: string): string {
    try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: false, locale: es });
    } catch {
        return "";
    }
}

// ─── Component ───────────────────────────────────────────

export function ActivityFeedItem({ log, showAvatar = true, compact = false, className, onClick }: ActivityFeedItemProps) {
    const actionVerb = getActionVerb(log.action);
    const actionConfig = actionConfigs[actionVerb];
    const moduleConfig = moduleConfigs[log.target_table];
    const entityName = getEntityName(log.metadata);
    const timeAgo = getTimeAgo(log.created_at);

    const userName = log.full_name || log.email || "Sistema";
    const isSystem = !log.full_name && !log.email;
    const actionLabel = actionConfig?.label?.toLowerCase() || actionVerb;
    // Use the sentence label (with article) for natural language
    const moduleLabel = moduleConfig?.label || log.target_table;

    return (
        <div
            className={cn(
                "flex items-start gap-3 group/feed-item",
                compact ? "py-2" : "py-3",
                onClick && "cursor-pointer hover:bg-muted/30 rounded-lg transition-colors",
                compact ? "px-1" : "px-3",
                className
            )}
            onClick={() => onClick?.(log)}
        >
            {/* Avatar */}
            {showAvatar && (
                <Avatar className={cn("shrink-0 mt-0.5", compact ? "h-6 w-6" : "h-7 w-7")}>
                    {!isSystem && log.avatar_url && (
                        <AvatarImage src={log.avatar_url} alt={userName} />
                    )}
                    <AvatarFallback className={cn("text-[10px] font-medium", compact && "text-[9px]")}>
                        {isSystem ? <User className="h-3 w-3" /> : getInitials(log.full_name)}
                    </AvatarFallback>
                </Avatar>
            )}

            {/* Content: time first, then sentence */}
            <div className={cn("flex-1 min-w-0", compact ? "text-xs" : "text-sm")}>
                <p className="leading-relaxed">
                    {/* Time first */}
                    <span className="text-muted-foreground/50 tabular-nums">{timeAgo}</span>
                    <span className="text-muted-foreground/30"> · </span>

                    {/* Who */}
                    <span className="font-medium text-foreground">{userName}</span>
                    {" "}

                    {/* Action verb + module (natural sentence) */}
                    <span className="text-muted-foreground">{actionLabel} {moduleLabel}</span>

                    {/* Entity name (bold) */}
                    {entityName && (
                        <>
                            {" "}
                            <span className="font-medium text-foreground">{entityName}</span>
                        </>
                    )}

                    {/* Bulk count */}
                    {log.metadata?.count && (
                        <>
                            {" "}
                            <span className="text-muted-foreground">({log.metadata.count} registros)</span>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}

// ─── Feed List Component ─────────────────────────────────

interface ActivityFeedListProps {
    logs: ActivityLogItem[];
    /** Show avatars (default: true) */
    showAvatars?: boolean;
    /** Compact mode (default: false) */
    compact?: boolean;
    /** Max items to show (default: all) */
    maxItems?: number;
    /** Click handler for individual items */
    onItemClick?: (log: ActivityLogItem) => void;
    /** Additional className */
    className?: string;
}

export function ActivityFeedList({ logs, showAvatars = true, compact = false, maxItems, onItemClick, className }: ActivityFeedListProps) {
    const displayLogs = maxItems ? logs.slice(0, maxItems) : logs;

    return (
        <div className={cn("divide-y divide-border/30", className)}>
            {displayLogs.map(log => (
                <ActivityFeedItem
                    key={log.id}
                    log={log}
                    showAvatar={showAvatars}
                    compact={compact}
                    onClick={onItemClick}
                />
            ))}
        </div>
    );
}
