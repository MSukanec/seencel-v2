"use client";

import { useMemo } from "react";
import type { WidgetProps } from "@/components/widgets/grid/types";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { WidgetEmptyState } from "@/components/widgets/grid/widget-empty-state";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface TeamMemberData {
    id: string;
    user_full_name: string | null;
    user_avatar_url: string | null;
    user_email: string | null;
    role_name: string | null;
    last_active_at: string | null;
}

type PresenceStatus = "online" | "recent" | "offline";

// ============================================================================
// Helpers
// ============================================================================

function getPresenceStatus(lastActiveAt: string | null): PresenceStatus {
    if (!lastActiveAt) return "offline";
    const diff = Date.now() - new Date(lastActiveAt).getTime();
    const minutes = diff / (1000 * 60);
    if (minutes < 5) return "online";
    if (minutes < 60) return "recent";
    return "offline";
}

function getRelativeTime(dateStr: string | null): string {
    if (!dateStr) return "Sin actividad";
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `hace ${days}d`;
    const weeks = Math.floor(days / 7);
    return `hace ${weeks}sem`;
}

function getInitials(name: string | null, email: string | null): string {
    if (name) {
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || "?";
}

const STATUS_COLORS: Record<PresenceStatus, string> = {
    online: "bg-primary",
    recent: "bg-amber-500",
    offline: "bg-muted-foreground/40",
};



// ============================================================================
// Component
// ============================================================================

export function TeamMembersWidget({ initialData }: WidgetProps) {
    const members: TeamMemberData[] = useMemo(() => {
        if (!Array.isArray(initialData)) return [];
        return initialData as TeamMemberData[];
    }, [initialData]);

    return (
        <div className="h-full flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            {/* Header — matches Activity / Upcoming Events pattern */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <div className="p-1.5 rounded-md bg-primary/10">
                    <Users className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold leading-none">Equipo</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {members.length} miembro{members.length !== 1 ? "s" : ""} activo{members.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 pb-2">
                {members.length === 0 ? (
                    <WidgetEmptyState
                        icon={Users}
                        title="Sin miembros"
                        description="Invitá miembros desde Configuración"
                        href="/organization/team"
                        actionLabel="Ir a Configuración"
                    />
                ) : (
                    <div className="space-y-1 pt-2">
                        {members.map((member) => (
                            <MemberRow key={member.id} member={member} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Member Row — matches ActivityWidget row sizes (h-9 w-9 avatar, gap-3, text-sm/text-xs)
// ============================================================================

function MemberRow({ member }: { member: TeamMemberData }) {
    const status = getPresenceStatus(member.last_active_at);
    const timeAgo = getRelativeTime(member.last_active_at);

    return (
        <div className="flex items-center gap-3 py-1.5">
            {/* Avatar with status indicator — same h-9 w-9 as ActivityWidget */}
            <div className="relative shrink-0">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={member.user_avatar_url || undefined} alt={member.user_full_name || ""} />
                    <AvatarFallback className="text-xs bg-muted">
                        {getInitials(member.user_full_name, member.user_email)}
                    </AvatarFallback>
                </Avatar>
                {/* Presence dot */}
                <span
                    className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                        STATUS_COLORS[status]
                    )}
                />
            </div>

            {/* Name + time — same text-sm / text-xs as ActivityWidget */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                    {member.user_full_name || member.user_email || "Sin nombre"}
                </p>
                <p className="text-xs text-muted-foreground">
                    {timeAgo}
                </p>
            </div>

            {/* Role badge — neutral, no color */}
            <Badge variant="outline" className="text-[10px] h-auto py-0.5 px-1.5 text-muted-foreground font-normal border-border/50">
                {member.role_name || "Miembro"}
            </Badge>
        </div>
    );
}
