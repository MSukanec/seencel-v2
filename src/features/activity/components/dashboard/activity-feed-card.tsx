"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, ArrowRight } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";
import { moduleConfigs, actionConfigs, getActionVerb } from "@/config/audit-logs";

// Use flexible interface that works with different activity data structures
interface ActivityLog {
    id: string;
    action: string;
    target_table?: string | null;
    entity_type?: string | null;
    target_id?: string | null;
    entity_name?: string | null;
    created_at: string;
    full_name?: string | null;
    user_name?: string | null;
    avatar_url?: string | null;
    user_avatar?: string | null;
    email?: string | null;
    metadata?: Record<string, unknown> | null;
}

interface ActivityFeedCardProps {
    activity: ActivityLog[];
    className?: string;
}

export function ActivityFeedCard({ activity, className }: ActivityFeedCardProps) {
    // Only show first 5 items for dashboard
    const recentActivity = activity.slice(0, 5);

    return (
        <DashboardCard
            title="Actividad Reciente"
            description="Últimas acciones del equipo"
            icon={<Activity className="w-4 h-4" />}
            className={className}
            contentClassName="p-0"
            headerAction={
                <Link
                    href="/organization/settings"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                    Ver Todo
                    <ArrowRight className="h-3 w-3" />
                </Link>
            }
        >
            {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                    <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Sin actividad reciente</p>
                </div>
            ) : (
                <div className="divide-y divide-border/50">
                    {recentActivity.map((log, i) => {
                        // Get module config - try both field names
                        const entityType = log.target_table || log.entity_type || "";
                        const moduleConfig = moduleConfigs[entityType];
                        const ModuleIcon = moduleConfig?.icon;

                        // Get action config
                        const actionVerb = getActionVerb(log.action);
                        const actionConfig = actionConfigs[actionVerb];

                        // Get user info - try both field name patterns
                        const userName = log.full_name || log.user_name || log.email || "Usuario";
                        const userAvatar = log.avatar_url || log.user_avatar || "";

                        // Get entity name from metadata if available
                        const metadata = log.metadata as Record<string, any> || {};
                        const entityName = log.entity_name || metadata.name ||
                            (metadata.first_name && metadata.last_name
                                ? `${metadata.first_name} ${metadata.last_name}`
                                : metadata.first_name || null);

                        return (
                            <div
                                key={log.id || i}
                                className="px-4 py-3 hover:bg-muted/30 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    {/* User Avatar */}
                                    <Avatar className="h-8 w-8 border shrink-0">
                                        <AvatarImage src={userAvatar} />
                                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                            {userName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* User + Action */}
                                        <div className="flex flex-wrap items-center gap-1.5 text-sm">
                                            <span className="font-medium text-foreground">
                                                {userName}
                                            </span>

                                            {/* Action Badge */}
                                            {actionConfig && (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] px-1.5 py-0 h-5 font-medium ${actionConfig.color}`}
                                                >
                                                    {actionConfig.label.toLowerCase()}
                                                </Badge>
                                            )}

                                            {/* Module Badge */}
                                            {moduleConfig && (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] px-1.5 py-0 h-5 font-medium gap-1 ${moduleConfig.color}`}
                                                >
                                                    {ModuleIcon && <ModuleIcon className="h-2.5 w-2.5" />}
                                                    {moduleConfig.label}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Entity Name if available */}
                                        {entityName && (
                                            <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                                "{entityName}"
                                            </p>
                                        )}

                                        {/* Timestamp */}
                                        <p className="text-[11px] text-muted-foreground/70 mt-1">
                                            {formatDistanceToNow(new Date(log.created_at), {
                                                addSuffix: true,
                                                locale: es
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </DashboardCard>
    );
}

