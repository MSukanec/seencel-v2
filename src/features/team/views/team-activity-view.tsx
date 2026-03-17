"use client";

/**
 * Team Activity View — Linear-style feed
 * 
 * Muestra la actividad de la organización como un feed de frases naturales
 * en vez de una tabla tradicional. Usa ActivityFeedList centralizado.
 */

import { useState, useMemo, useEffect } from "react";
import { OrganizationActivityLog } from "@/features/team/types";
import { getActivityFeedItems } from "@/actions/widget-actions";
import { useTableFilters } from "@/hooks/use-table-filters";
import { ToolbarCard, FilterPopover, SearchButton } from "@/components/shared/toolbar-controls";
import { ActivityFeedList } from "@/components/shared/activity-feed";
import { User, Activity, ListOrdered, ActivitySquare } from "lucide-react";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { moduleConfigs, getActionVerb } from "@/config/audit-logs";
import { Card } from "@/components/ui/card";

interface TeamActivityViewProps {
    logs?: OrganizationActivityLog[];
}

export function TeamActivityView({ logs: initialLogs }: TeamActivityViewProps) {
    const [logs, setLogs] = useState<OrganizationActivityLog[]>(initialLogs || []);
    const [isLoading, setIsLoading] = useState(!initialLogs);

    // Auto-fetch if no initial data provided
    useEffect(() => {
        if (initialLogs) return;
        getActivityFeedItems("organization", 50)
            .then((data) => {
                setLogs(data as OrganizationActivityLog[]);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [initialLogs]);

    // ─── Filter config ───────────────────────────────────

    const userOptions = useMemo(() => {
        const users = new Set(logs.map(log => log.full_name || log.email || "Sistema"));
        return Array.from(users).map(user => ({ label: user, value: user }));
    }, [logs]);

    const ACTION_OPTIONS = useMemo(() => [
        { label: "Creó", value: "Creó" },
        { label: "Actualizó", value: "Actualizó" },
        { label: "Eliminó", value: "Eliminó" },
        { label: "Importó", value: "Importó" },
        { label: "Archivó", value: "Archivó" },
    ], []);

    const MODULE_OPTIONS = useMemo(() => {
        const modules = new Set(logs.map(log => {
            const config = moduleConfigs[log.target_table];
            return config?.displayLabel || log.target_table;
        }));
        return Array.from(modules).map(m => ({ label: m, value: m }));
    }, [logs]);

    const filters = useTableFilters({
        facets: [
            { key: "member", title: "Usuario", icon: User, options: userOptions },
            { key: "action", title: "Acción", icon: Activity, options: ACTION_OPTIONS },
            { key: "target_table", title: "Herramienta", icon: ListOrdered, options: MODULE_OPTIONS },
        ],
        enableDateRange: true,
    });

    // ─── Filtered data ───────────────────────────────────

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            // Search
            if (filters.searchQuery) {
                const q = filters.searchQuery.toLowerCase();
                const userName = (log.full_name || log.email || "").toLowerCase();
                const module = (log.target_table || "").toLowerCase();
                const action = (log.action || "").toLowerCase();
                const metadata = JSON.stringify(log.metadata || {}).toLowerCase();
                if (!userName.includes(q) && !module.includes(q) && !action.includes(q) && !metadata.includes(q)) {
                    return false;
                }
            }

            // User Facet
            if (filters.facetValues.member && filters.facetValues.member.size > 0) {
                const userName = log.full_name || log.email || "Sistema";
                if (!filters.facetValues.member.has(userName)) return false;
            }

            // Module Facet
            if (filters.facetValues.target_table && filters.facetValues.target_table.size > 0) {
                const config = moduleConfigs[log.target_table];
                const entityLabel = config?.displayLabel || log.target_table;
                if (!filters.facetValues.target_table.has(entityLabel)) return false;
            }

            // Action Facet
            if (filters.facetValues.action && filters.facetValues.action.size > 0) {
                const actionVerb = getActionVerb(log.action);
                const actionLabel = { create: "Creó", update: "Actualizó", delete: "Eliminó", import: "Importó", archive: "Archivó" }[actionVerb] || actionVerb;
                if (!filters.facetValues.action.has(actionLabel)) return false;
            }

            // Date range
            if (filters.dateRange?.from) {
                const logDate = new Date(log.created_at);
                const from = startOfDay(filters.dateRange.from);
                const to = filters.dateRange.to ? endOfDay(filters.dateRange.to) : endOfDay(filters.dateRange.from);
                if (!isWithinInterval(logDate, { start: from, end: to })) return false;
            }

            return true;
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [logs, filters]);

    // ─── Empty State ─────────────────────────────────────

    if (!isLoading && logs.length === 0) {
        return (
            <ViewEmptyState mode="empty" viewName="Actividad" icon={ActivitySquare} />
        );
    }

    // ─── No-results ──────────────────────────────────────

    if (!isLoading && filteredLogs.length === 0) {
        return (
            <div className="flex flex-col gap-0.5">
                <ToolbarCard
                    right={
                        <>
                            <SearchButton filters={filters} placeholder="Buscar en actividad..." />
                            <FilterPopover filters={filters} />
                        </>
                    }
                />
                <ViewEmptyState mode="no-results" viewName="Actividad" icon={ActivitySquare} onAction={filters.clearAll} />
            </div>
        );
    }

    // ─── Render ──────────────────────────────────────────

    return (
        <div className="flex flex-col gap-4 w-full">
            <ToolbarCard
                right={
                    <>
                        <SearchButton filters={filters} placeholder="Buscar en actividad..." />
                        <FilterPopover filters={filters} />
                    </>
                }
            />
            <Card variant="inset">
                <ActivityFeedList logs={filteredLogs} />
            </Card>
        </div>
    );
}
