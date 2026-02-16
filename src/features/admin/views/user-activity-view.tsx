"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Clock,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Footprints,
    Calendar,
} from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { getViewName } from "@/lib/view-name-map";
import { cn } from "@/lib/utils";

interface ViewHistoryEntry {
    id: string;
    view_name: string;
    entered_at: string;
    exited_at: string | null;
    duration_seconds: number | null;
    session_id: string | null;
}

interface UserActivityViewProps {
    viewHistory: ViewHistoryEntry[];
}

interface SessionGroup {
    session_id: string;
    started_at: string;
    steps: ViewHistoryEntry[];
    total_duration: number;
}

export function UserActivityView({ viewHistory }: UserActivityViewProps) {
    const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

    // Group history entries by session_id
    const sessions: SessionGroup[] = useMemo(() => {
        const sessionMap = new Map<string, ViewHistoryEntry[]>();

        viewHistory.forEach((entry) => {
            const key = entry.session_id || `orphan-${entry.id}`;
            if (!sessionMap.has(key)) {
                sessionMap.set(key, []);
            }
            sessionMap.get(key)!.push(entry);
        });

        return Array.from(sessionMap.entries())
            .map(([session_id, steps]) => {
                // Sort steps by entered_at (oldest first)
                const sorted = steps.sort(
                    (a, b) => new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime()
                );
                const total_duration = sorted.reduce(
                    (acc, s) => acc + (s.duration_seconds || 0), 0
                );
                return {
                    session_id,
                    started_at: sorted[0].entered_at,
                    steps: sorted,
                    total_duration,
                };
            })
            // Sort sessions by most recent first
            .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    }, [viewHistory]);

    const toggleSession = (sessionId: string) => {
        setExpandedSessions((prev) => {
            const next = new Set(prev);
            if (next.has(sessionId)) {
                next.delete(sessionId);
            } else {
                next.add(sessionId);
            }
            return next;
        });
    };

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
        const h = Math.floor(seconds / 3600);
        const m = Math.round((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    if (sessions.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
                <div className="text-center text-muted-foreground">
                    <Footprints className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Sin actividad registrada</p>
                    <p className="text-sm">Este usuario no tiene historial de navegación</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 pb-8">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">
                    {sessions.length} sesiones · {viewHistory.length} páginas visitadas
                </p>
            </div>

            {sessions.map((session) => {
                const isExpanded = expandedSessions.has(session.session_id);
                const firstPage = getViewName(session.steps[0]?.view_name);
                const lastPage = session.steps.length > 1
                    ? getViewName(session.steps[session.steps.length - 1]?.view_name)
                    : null;

                return (
                    <Card key={session.session_id} className="overflow-hidden">
                        {/* Session Header */}
                        <button
                            onClick={() => toggleSession(session.session_id)}
                            className="w-full text-left"
                        >
                            <CardHeader className="py-3 px-4 hover:bg-accent/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    {/* Session icon */}
                                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary shrink-0">
                                        <Footprints className="h-4 w-4" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium">{firstPage}</span>
                                            {lastPage && (
                                                <>
                                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-sm font-medium">{lastPage}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(session.started_at), "d MMM yyyy, HH:mm", { locale: es })}
                                            </span>
                                            <span>·</span>
                                            <span>{formatDistanceToNowStrict(new Date(session.started_at), { addSuffix: true, locale: es })}</span>
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge variant="secondary" className="shadow-none text-xs">
                                            {session.steps.length} pág
                                        </Badge>
                                        {session.total_duration > 0 && (
                                            <Badge variant="outline" className="shadow-none text-xs gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDuration(session.total_duration)}
                                            </Badge>
                                        )}
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                        </button>

                        {/* Expanded Steps Timeline */}
                        {isExpanded && (
                            <CardContent className="pt-0 pb-4 px-4">
                                <div className="ml-[18px] border-l-2 border-border pl-6 space-y-0">
                                    {session.steps.map((step, idx) => (
                                        <div
                                            key={step.id}
                                            className={cn(
                                                "relative py-2.5",
                                                idx < session.steps.length - 1 && "border-b border-border/50"
                                            )}
                                        >
                                            {/* Dot on the timeline */}
                                            <div className={cn(
                                                "absolute -left-[31px] top-3.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                                                idx === 0
                                                    ? "bg-primary"
                                                    : idx === session.steps.length - 1
                                                        ? "bg-muted-foreground"
                                                        : "bg-border"
                                            )} />

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-sm font-medium">
                                                        {getViewName(step.view_name)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        {format(new Date(step.entered_at), "HH:mm:ss")}
                                                    </span>
                                                </div>
                                                {step.duration_seconds != null && step.duration_seconds > 0 && (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDuration(step.duration_seconds)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}
