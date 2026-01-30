"use client";

import { useState, useMemo } from "react";
import { AdminActivityLog } from "@/actions/admin-actions";
import { AdminActivityLogsDataTable } from "./admin-activity-logs-data-table";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Route, FileText } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface UserJourney {
    session_id: string;
    user_name: string;
    avatar_url: string | null;
    started_at: string | null;
    steps: { view: string; duration: number }[];
}

interface AdminActivityViewProps {
    logs: AdminActivityLog[];
    userJourneys: UserJourney[];
}

const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

export function AdminActivityView({ logs, userJourneys }: AdminActivityViewProps) {
    const [activeTab, setActiveTab] = useState("logs");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter logs by search
    const filteredLogs = useMemo(() => {
        if (!searchQuery) return logs;
        const q = searchQuery.toLowerCase();
        return logs.filter(log =>
            log.full_name?.toLowerCase().includes(q) ||
            log.email?.toLowerCase().includes(q) ||
            log.action?.toLowerCase().includes(q) ||
            log.target_table?.toLowerCase().includes(q) ||
            log.organization_name?.toLowerCase().includes(q)
        );
    }, [logs, searchQuery]);

    // Filter journeys by search
    const filteredJourneys = useMemo(() => {
        if (!searchQuery) return userJourneys;
        const q = searchQuery.toLowerCase();
        return userJourneys.filter(j =>
            j.user_name?.toLowerCase().includes(q) ||
            j.steps.some(s => s.view.toLowerCase().includes(q))
        );
    }, [userJourneys, searchQuery]);

    return (
        <div className="flex flex-col gap-4">
            <Toolbar
                searchPlaceholder="Buscar actividad..."
                onSearchChange={setSearchQuery}
                leftActions={
                    <ToolbarTabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        options={[
                            { value: "logs", label: "Logs", icon: FileText },
                            { value: "journeys", label: "User Journeys", icon: Route },
                        ]}
                    />
                }
            />

            {activeTab === "logs" && (
                <AdminActivityLogsDataTable data={filteredLogs} />
            )}

            {activeTab === "journeys" && (
                <DashboardCard
                    title="User Journeys"
                    description="Flujo de navegación de usuarios reales (ordenados por fecha)"
                    icon={<Route className="h-4 w-4" />}
                >
                    <div className="space-y-4">
                        {filteredJourneys.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Route className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No hay journeys que coincidan con la búsqueda.</p>
                            </div>
                        ) : (
                            filteredJourneys.map((journey) => (
                                <div key={journey.session_id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <Avatar className="h-8 w-8 mt-0.5">
                                        <AvatarImage src={journey.avatar_url || ""} />
                                        <AvatarFallback>{journey.user_name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium">{journey.user_name}</span>
                                            {journey.started_at && (
                                                <span className="text-xs text-muted-foreground">
                                                    • {format(new Date(journey.started_at), "dd/MM HH:mm", { locale: es })}
                                                    <span className="ml-1 opacity-70">
                                                        ({formatDistanceToNow(new Date(journey.started_at), { addSuffix: true, locale: es })})
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {journey.steps.map((step, i) => (
                                                <span key={i} className="inline-flex items-center">
                                                    <Badge variant="outline" className="text-[10px] h-6 bg-background px-2 font-medium">
                                                        {step.view}
                                                        {step.duration > 0 && <span className="ml-1.5 text-muted-foreground font-normal border-l pl-1.5">{formatDuration(step.duration)}</span>}
                                                    </Badge>
                                                    {i < journey.steps.length - 1 && <span className="mx-1 text-muted-foreground/40 text-xs">→</span>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DashboardCard>
            )}
        </div>
    );
}
