"use client";

import { useState, useMemo } from "react";
import { OrganizationActivityLog } from "@/features/team/types";
import { TeamActivityLogsTable } from "@/features/team/components/team-activity-logs-table";
import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { DateRangeFilter, DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";
import { moduleConfigs, actionConfigs, getActionVerb } from "@/config/audit-logs";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

interface TeamActivityViewProps {
    logs: OrganizationActivityLog[];
}

export function TeamActivityView({ logs = [] }: TeamActivityViewProps) {
    // Search state
    const [searchQuery, setSearchQuery] = useState("");

    // Filter states
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
    const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);

    // Compute unique users for filter
    const userOptions = useMemo(() => {
        const users = new Set(logs.map(log => log.full_name || log.email || "Sistema"));
        return Array.from(users).map(user => ({ label: user, value: user }));
    }, [logs]);

    // Module options from config
    const moduleOptions = useMemo(() => {
        return Object.entries(moduleConfigs).map(([key, config]) => ({
            label: config.label,
            value: key
        }));
    }, []);

    // Action options from config
    const actionOptions = useMemo(() => {
        return Object.entries(actionConfigs).map(([key, config]) => ({
            label: config.label,
            value: key
        }));
    }, []);

    // Toggle handlers for FacetedFilter
    const handleUserSelect = (value: string) => {
        setSelectedUsers(prev => {
            const next = new Set(prev);
            if (next.has(value)) next.delete(value);
            else next.add(value);
            return next;
        });
    };

    const handleModuleSelect = (value: string) => {
        setSelectedModules(prev => {
            const next = new Set(prev);
            if (next.has(value)) next.delete(value);
            else next.add(value);
            return next;
        });
    };

    const handleActionSelect = (value: string) => {
        setSelectedActions(prev => {
            const next = new Set(prev);
            if (next.has(value)) next.delete(value);
            else next.add(value);
            return next;
        });
    };

    // Filter logs
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            // Search filter
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const userName = (log.full_name || log.email || "").toLowerCase();
                const module = (log.target_table || "").toLowerCase();
                const action = (log.action || "").toLowerCase();
                const metadata = JSON.stringify(log.metadata || {}).toLowerCase();

                if (!userName.includes(searchLower) &&
                    !module.includes(searchLower) &&
                    !action.includes(searchLower) &&
                    !metadata.includes(searchLower)) {
                    return false;
                }
            }

            // User filter
            if (selectedUsers.size > 0) {
                const userName = log.full_name || log.email || "Sistema";
                if (!selectedUsers.has(userName)) return false;
            }

            // Module filter
            if (selectedModules.size > 0) {
                if (!selectedModules.has(log.target_table)) return false;
            }

            // Action filter
            if (selectedActions.size > 0) {
                const actionVerb = getActionVerb(log.action);
                if (!selectedActions.has(actionVerb)) return false;
            }

            // Date range filter
            if (dateRange?.from) {
                const logDate = new Date(log.created_at);
                const from = startOfDay(dateRange.from);
                const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

                if (!isWithinInterval(logDate, { start: from, end: to })) {
                    return false;
                }
            }

            return true;
        });
    }, [logs, searchQuery, selectedUsers, selectedModules, selectedActions, dateRange]);

    // Filter content for Toolbar
    const filterContent = (
        <>
            <DateRangeFilter
                title="Fechas"
                value={dateRange}
                onChange={setDateRange}
            />
            <FacetedFilter
                title="Usuario"
                options={userOptions}
                selectedValues={selectedUsers}
                onSelect={handleUserSelect}
                onClear={() => setSelectedUsers(new Set())}
            />
            <FacetedFilter
                title="Módulo"
                options={moduleOptions}
                selectedValues={selectedModules}
                onSelect={handleModuleSelect}
                onClear={() => setSelectedModules(new Set())}
            />
            <FacetedFilter
                title="Acción"
                options={actionOptions}
                selectedValues={selectedActions}
                onSelect={handleActionSelect}
                onClear={() => setSelectedActions(new Set())}
            />
        </>
    );

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar en actividad..."
                filterContent={filterContent}
            />
            <div className="flex-1 overflow-y-auto">
                <ContentLayout variant="wide">
                    <TeamActivityLogsTable data={filteredLogs} />
                </ContentLayout>
            </div>
        </div>
    );
}
