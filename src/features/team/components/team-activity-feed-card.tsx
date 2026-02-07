"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, ArrowRight } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

// Helper to build natural sentence
// Example: "Matías Sukanec actualizó el subcontrato "Contratista General""
function buildActivitySentence(
    userName: string,
    actionLabel: string,
    singularModule: string,
    entityName: string | null
): React.ReactNode {
    // Determine article based on module
    const getArticle = (module: string): string => {
        // Feminine words
        const feminine = ['tarea', 'organización', 'entrada', 'categoría', 'tarjeta', 'columna', 'etiqueta', 'compra', 'importación'];
        const isFeminine = feminine.some(f => module.includes(f));
        return isFeminine ? 'la' : 'el';
    };

    const article = getArticle(singularModule);

    return (
        <span className="text-sm leading-relaxed">
            <span className="font-semibold text-foreground">{userName}</span>
            <span className="text-muted-foreground"> {actionLabel.toLowerCase()} {article} {singularModule}</span>
            {entityName && (
                <>
                    <span className="text-muted-foreground"> </span>
                    <span className="font-semibold text-foreground">{entityName}</span>
                </>
            )}
        </span>
    );
}

export function TeamActivityFeedCard({ activity, className }: ActivityFeedCardProps) {
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

                        // Use singularLabel for natural sentences, fallback to formatted table name
                        const singularModule = moduleConfig?.singularLabel ||
                            entityType.replace(/_/g, ' ').toLowerCase();

                        // Get action config
                        const actionVerb = getActionVerb(log.action);
                        const actionConfig = actionConfigs[actionVerb];
                        const actionLabel = actionConfig?.label || actionVerb;

                        // Get user info - try both field name patterns
                        const userName = log.full_name || log.user_name || log.email || "Usuario";
                        const userAvatar = log.avatar_url || log.user_avatar || "";

                        // Get entity name from metadata if available
                        const metadata = log.metadata as Record<string, any> || {};
                        const entityName = log.entity_name || metadata.name ||
                            (metadata.first_name && metadata.last_name
                                ? `${metadata.first_name} ${metadata.last_name}`
                                : metadata.first_name || metadata.title || null);

                        return (
                            <div
                                key={log.id || i}
                                className="px-6 py-3 hover:bg-muted/30 transition-colors"
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
                                        {/* Natural Sentence */}
                                        <div className="leading-snug">
                                            {buildActivitySentence(
                                                userName,
                                                actionLabel,
                                                singularModule,
                                                entityName
                                            )}
                                        </div>

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
