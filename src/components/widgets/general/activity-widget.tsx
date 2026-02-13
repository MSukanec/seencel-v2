"use client";

import { useEffect, useState, useTransition } from "react";
import type { WidgetProps } from "@/components/widgets/grid/types";
import { Activity, Loader2 } from "lucide-react";
import { getActivityFeedItems, type ActivityFeedItem } from "@/actions/widget-actions";
import { moduleConfigs, actionConfigs, getActionVerb, moduleRoutes } from "@/config/audit-logs";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmptyState } from "@/components/widgets/grid/widget-empty-state";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActiveProjectId } from "@/stores/layout-store";
import { useLayoutActions } from "@/stores/layout-store";
import { useRouter } from "@/i18n/routing";

// ============================================================================
// ACTIVITY WIDGET (Feed-style, Parametric, Autonomous)
// ============================================================================

const SCOPE_TITLES: Record<string, string> = {
    organization: "Actividad General",
    finance: "Actividad Financiera",
    project: "Actividad de Proyectos",
};

function getDetailText(item: ActivityFeedItem): string {
    const metadata = item.metadata || {};
    return metadata.name || metadata.title || metadata.description || "";
}

function ActivityItemRow({
    item,
    isNavigating,
    onNavigate,
}: {
    item: ActivityFeedItem;
    isNavigating: boolean;
    onNavigate?: (item: ActivityFeedItem) => void;
}) {
    const verb = getActionVerb(item.action);
    const actionCfg = actionConfigs[verb];
    const moduleCfg = moduleConfigs[item.target_table];

    const actionLabel = actionCfg?.label || verb;
    const moduleLabel = moduleCfg?.label || item.target_table;
    const detail = getDetailText(item);
    const initials = (item.full_name || "?")
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const description = detail
        ? `${actionLabel} ${moduleLabel} › ${detail}`
        : `${actionLabel} ${moduleLabel}`;

    const hasRoute = !!moduleRoutes[item.target_table];

    return (
        <div
            className={`flex items-center gap-3 py-2 flex-1 ${hasRoute
                    ? 'cursor-pointer hover:bg-muted/50 rounded-md px-1 -mx-1 transition-colors'
                    : ''
                } ${isNavigating ? 'opacity-60' : ''}`}
            onClick={() => hasRoute && !isNavigating && onNavigate?.(item)}
        >
            {/* Avatar with tooltip */}
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={item.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-muted">
                                {isNavigating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    initials
                                )}
                            </AvatarFallback>
                        </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs">
                        {item.full_name || "Sistema"}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                    {description}
                </p>
                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                        locale: es,
                    })}
                </p>
            </div>

            {/* Loading spinner for navigating item */}
            {isNavigating && (
                <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin shrink-0" />
            )}
        </div>
    );
}

function ActivityFeedSkeleton() {
    return (
        <div className="space-y-4 px-3 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ActivityWidget({ size, config, initialData }: WidgetProps) {
    const scope = config?.scope || "organization";
    const activeProjectId = useActiveProjectId();
    const { setActiveProjectId } = useLayoutActions();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [navigatingId, setNavigatingId] = useState<string | null>(null);

    const [items, setItems] = useState<ActivityFeedItem[] | null>(
        initialData ?? null
    );

    // Fetch on mount + re-fetch when project context changes
    useEffect(() => {
        if (!activeProjectId && initialData) return;

        let cancelled = false;
        setItems(null);
        getActivityFeedItems(scope, 5, activeProjectId).then((data) => {
            if (!cancelled) setItems(data);
        });
        return () => {
            cancelled = true;
        };
    }, [scope, activeProjectId, initialData]);

    // Deep linking: navigate with startTransition for non-blocking UI
    const handleNavigate = (item: ActivityFeedItem) => {
        const route = moduleRoutes[item.target_table];
        if (!route) return;

        // Set project context if available in metadata
        const metadataProjectId = item.metadata?.project_id;
        if (metadataProjectId) {
            setActiveProjectId(metadataProjectId);
        }

        // Show immediate visual feedback
        setNavigatingId(item.id);

        // Navigate with startTransition so UI stays responsive
        startTransition(() => {
            router.push(route as any);
        });
    };

    // Clear navigating state when transition ends
    useEffect(() => {
        if (!isPending) {
            setNavigatingId(null);
        }
    }, [isPending]);

    const title = activeProjectId
        ? "Actividad del Proyecto"
        : (SCOPE_TITLES[scope] || "Actividad");

    return (
        <div className="h-full flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <div className="p-1.5 rounded-md bg-primary/10">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold leading-none">
                        {title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        Actividad reciente
                    </p>
                </div>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto px-3">
                {items === null ? (
                    <ActivityFeedSkeleton />
                ) : items.length === 0 ? (
                    <WidgetEmptyState
                        icon={Activity}
                        title="Sin actividad"
                        description={activeProjectId
                            ? "No hay actividad registrada para este proyecto"
                            : "Las acciones de tu equipo aparecerán aquí"
                        }
                        href="/organization?view=activity"
                        actionLabel="Ver actividad"
                    />
                ) : (
                    <div className="flex flex-col h-full divide-y divide-border/30">
                        {items.map((item) => (
                            <ActivityItemRow
                                key={item.id}
                                item={item}
                                isNavigating={navigatingId === item.id}
                                onNavigate={handleNavigate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
