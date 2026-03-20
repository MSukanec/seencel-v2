"use client";

import { useState, useMemo, useCallback } from "react";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { useTableActions } from "@/hooks/use-table-actions";
import { Plus, Star, FileText, Table2, Newspaper, Shield, Cloud, Eye, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ToolbarCard } from "@/components/shared/toolbar-controls";
import { PageHeaderActionPortal } from "@/components/layout";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DataTable } from "@/components/shared/data-table/data-table";
import { useTableFilters } from "@/hooks/use-table-filters";
import { usePanel } from "@/stores/panel-store";
import { useActiveProjectId } from "@/stores/layout-store";
import { useOrganizationStore } from "@/stores/organization-store";
import { useShallow } from "zustand/react/shallow";
import { useRouter } from "@/i18n/routing";
import { type EntityParameter } from "@/components/shared/entity-context-menu";
import { SEVERITY_VISUAL_CONFIG, DEFAULT_SEVERITY_OPTIONS } from "@/components/shared/popovers/severity-popover-content";
import { WEATHER_VISUAL_CONFIG, DEFAULT_WEATHER_OPTIONS } from "@/components/shared/popovers/weather-popover-content";

import { SiteLog, SiteLogType } from "../types";
import { deleteSiteLog, updateSiteLogField } from "../actions";
import { SitelogFeed } from "../components/sitelog-feed";
import { getSitelogColumns } from "../tables/sitelog-columns";
import { toast } from "sonner";

// ── View mode ────────────────────────────────────────────
type ViewMode = "feed" | "table";

const VIEW_OPTIONS = [
    { value: "feed", icon: Newspaper, label: "Timeline" },
    { value: "table", icon: Table2, label: "Tabla" },
];

// ── Props ─────────────────────────────────────────────────
interface SitelogEntriesViewProps {
    organizationId: string;
    initialLogs: SiteLog[];
    initialTypes: SiteLogType[];
}

export function SitelogEntriesView({ organizationId, initialLogs, initialTypes }: SitelogEntriesViewProps) {
    const router = useRouter();
    const { openPanel } = usePanel();

    // View mode (feed = default)
    const [viewMode, setViewMode] = useState<ViewMode>("feed");

    // Project filter from global store (org-wide mode)
    const activeProjectId = useActiveProjectId();

    // Optimistic list (add, remove, update with auto-rollback)
    const { optimisticItems, removeItem, updateItem } = useOptimisticList({
        items: initialLogs,
        getItemId: (log) => log.id,
    });

    // Favorites filter (standalone toggle, not a facet)
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    // Project options from org store (for project column + chip)
    const projects = useOrganizationStore(useShallow(state => state.projects));
    const projectOptions = useMemo(() =>
        (projects || []).map(p => ({
            value: p.id,
            label: p.name,
            color: p.color || null,
            imageUrl: p.image_url || null,
            status: p.status || null,
        })),
        [projects]
    );
    const showProjectColumn = !activeProjectId;

    // ─── Table Filters ───────────────────────────────────
    const severityOptions = useMemo(() => [
        { label: 'Baja', value: 'low' },
        { label: 'Media', value: 'medium' },
        { label: 'Alta', value: 'high' },
        { label: 'Crítica', value: 'critical' },
    ], []);

    const typeOptions = useMemo(() => initialTypes.map(t => ({
        label: t.name,
        value: t.id,
    })), [initialTypes]);

    const weatherOptions = useMemo(() => [
        { label: 'Soleado', value: 'sunny' },
        { label: 'Parcialmente Nublado', value: 'partly_cloudy' },
        { label: 'Nublado', value: 'cloudy' },
        { label: 'Lluvia', value: 'rain' },
        { label: 'Tormenta', value: 'storm' },
        { label: 'Nieve', value: 'snow' },
        { label: 'Niebla', value: 'fog' },
        { label: 'Ventoso', value: 'windy' },
        { label: 'Granizo', value: 'hail' },
    ], []);

    const visibilityOptions = useMemo(() => [
        { label: 'Visible cliente', value: 'public' },
        { label: 'Solo interno', value: 'internal' },
    ], []);

    const filters = useTableFilters({
        facets: [
            { key: 'severity', title: 'Severidad', options: severityOptions },
            { key: 'type', title: 'Tipo', options: typeOptions },
            { key: 'weather', title: 'Clima', options: weatherOptions },
            { key: 'visibility', title: 'Visibilidad', options: visibilityOptions },
        ],
    });

    // ─── Inline Update (Optimistic) ─────────────────────
    const handleUpdateField = useCallback(async (row: SiteLog, field: string, value: string | boolean | null) => {
        // Optimistic: update UI immediately, server runs in background
        updateItem(row.id, { [field]: value } as Partial<SiteLog>, async () => {
            try {
                const result = await updateSiteLogField(organizationId, row.id, field as any, value);
                if (result.error) {
                    toast.error(`Error: ${result.error}`);
                    router.refresh();
                }
            } catch {
                toast.error("Error al actualizar");
                router.refresh();
            }
        });
    }, [organizationId, router, updateItem]);

    // ─── Columns (memoized) ──────────────────────────────
    const columns = useMemo(() => getSitelogColumns({
        logTypes: initialTypes,
        onUpdateField: handleUpdateField,
        showProjectColumn,
        projectOptions,
    }), [initialTypes, handleUpdateField, showProjectColumn, projectOptions]);

    // ─── Filtered Data ───────────────────────────────────
    const filteredLogs = useMemo(() => {
        let logs = [...optimisticItems];

        // Project Filter (org-wide mode)
        if (activeProjectId) {
            logs = logs.filter(log => log.project_id === activeProjectId);
        }

        // Search Filter
        if (filters.searchQuery) {
            const lowerQ = filters.searchQuery.toLowerCase();
            logs = logs.filter(log =>
                (log.comments?.toLowerCase().includes(lowerQ)) ||
                (log.author?.user?.full_name?.toLowerCase().includes(lowerQ)) ||
                (log.entry_type?.name.toLowerCase().includes(lowerQ))
            );
        }

        // Severity Facet
        const severityValues = filters.facetValues['severity'];
        if (severityValues && severityValues.size > 0) {
            logs = logs.filter(log => log.severity && severityValues.has(log.severity));
        }

        // Type Facet
        const typeValues = filters.facetValues['type'];
        if (typeValues && typeValues.size > 0) {
            logs = logs.filter(log => log.entry_type_id && typeValues.has(log.entry_type_id));
        }

        // Weather Facet
        const weatherValues = filters.facetValues['weather'];
        if (weatherValues && weatherValues.size > 0) {
            logs = logs.filter(log => log.weather && log.weather !== "none" && weatherValues.has(log.weather));
        }

        // Visibility Facet
        const visibilityValues = filters.facetValues['visibility'];
        if (visibilityValues && visibilityValues.size > 0) {
            logs = logs.filter(log => {
                const logVisibility = log.is_public ? 'public' : 'internal';
                return visibilityValues.has(logVisibility);
            });
        }

        // Favorites Filter
        if (showFavoritesOnly) {
            logs = logs.filter(log => log.is_favorite);
        }

        return logs;
    }, [optimisticItems, activeProjectId, filters.searchQuery, filters.facetValues, showFavoritesOnly]);

    // ─── Actions ─────────────────────────────────────────
    const allLogs = optimisticItems;

    const handleCreate = useCallback(() => {
        openPanel('sitelog-entry-form', {
            organizationId,
            projectId: activeProjectId ?? undefined,
            descriptionType: initialTypes,
        });
    }, [organizationId, activeProjectId, initialTypes, openPanel]);

    const handleEdit = useCallback((log: SiteLog) => {
        openPanel('sitelog-entry-form', {
            organizationId,
            // Solo pasar projectId fijo si hay un proyecto activo seleccionado
            // En contexto general, el ProjectChip del form permite cambiar proyecto
            projectId: activeProjectId || undefined,
            descriptionType: initialTypes,
            initialData: log,
        });
    }, [organizationId, activeProjectId, initialTypes, openPanel]);

    const { handleDelete, handleBulkDelete, DeleteConfirmDialog } = useTableActions<SiteLog>({
        onDelete: async (log) => {
            // Optimistic: remove immediately, server runs in background with auto-rollback
            removeItem(log.id, async () => {
                const result = await deleteSiteLog(organizationId, log.id);
                if (result.error) {
                    toast.error("Error al eliminar");
                    router.refresh();
                }
            });
            return { success: true };
        },
        entityName: "registro",
        entityNamePlural: "registros",
    });

    // ─── Context Menu Parameters (Zone 2 submenus) ──────
    const sitelogParameters: EntityParameter<SiteLog>[] = useMemo(() => {
        const SeverityIcon = (level: string) => {
            const config = SEVERITY_VISUAL_CONFIG[level as keyof typeof SEVERITY_VISUAL_CONFIG];
            if (!config) return null;
            const I = config.icon;
            return <I className={cn("h-3.5 w-3.5", config.labelClass)} />;
        };

        const WeatherIcon = (weather: string) => {
            const config = WEATHER_VISUAL_CONFIG[weather as keyof typeof WEATHER_VISUAL_CONFIG];
            if (!config) return null;
            const I = config.icon;
            return <I className={cn("h-3.5 w-3.5", config.color)} />;
        };

        return [
            {
                label: "Severidad",
                icon: Shield,
                options: DEFAULT_SEVERITY_OPTIONS.map(o => ({
                    value: o.value,
                    label: o.label,
                    icon: SeverityIcon(o.value),
                })),
                currentValueKey: "severity",
                onSelect: (log, value) => handleUpdateField(log, "severity", value === "none" ? null : value),
            },
            ...(initialTypes.length > 0 ? [{
                label: "Tipo",
                icon: Tag,
                options: initialTypes.map(t => ({
                    value: t.id,
                    label: t.name,
                })),
                currentValueKey: "entry_type_id",
                onSelect: (log: SiteLog, value: string) => handleUpdateField(log, "entry_type_id", value),
            }] : []),
            {
                label: "Clima",
                icon: Cloud,
                options: DEFAULT_WEATHER_OPTIONS.map(o => ({
                    value: o.value,
                    label: o.label,
                    icon: WeatherIcon(o.value),
                })),
                currentValueKey: "weather",
                onSelect: (log, value) => handleUpdateField(log, "weather", value),
            },
            {
                label: "Visibilidad",
                icon: Eye,
                options: [
                    { value: "public", label: "Visible cliente" },
                    { value: "internal", label: "Solo interno" },
                ],
                currentValueKey: "is_public",
                onSelect: (log, value) => handleUpdateField(log, "is_public", value === "public"),
            },
        ];
    }, [initialTypes, handleUpdateField]);

    // === Header Action ===
    const headerAction = (
        <PageHeaderActionPortal>
            <Button onClick={handleCreate} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Crear registro
            </Button>
        </PageHeaderActionPortal>
    );

    // === EARLY RETURN: Empty State (no toolbar) ===
    if (allLogs.length === 0) {
        return (
            <>
                {headerAction}
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={FileText}
                        viewName="Bitácora de Obra"
                        featureDescription="La bitácora de obra registra las actividades diarias, incidencias, condiciones climáticas y avances de tus proyectos de construcción."
                        onAction={handleCreate}
                        actionLabel="Crear registro"
                        docsPath="/docs/construccion/bitacora-de-obra"
                        totalCount={allLogs.length}
                    />
                </div>
            </>
        );
    }

    // === EARLY RETURN: No Results (with toolbar) ===
    if (filters.hasActiveFilters && filteredLogs.length === 0) {
        return (
            <>
                {headerAction}
                <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                    <ToolbarCard
                        filters={filters}
                        searchPlaceholder="Buscar en bitácora..."
                        display={{
                            viewMode,
                            onViewModeChange: (v) => setViewMode(v as ViewMode),
                            viewModeOptions: VIEW_OPTIONS,
                        }}
                        right={
                            <Button
                                variant={showFavoritesOnly ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                                className={cn("h-8 px-3 border-dashed", showFavoritesOnly && "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20")}
                            >
                                <Star className={cn("h-4 w-4 mr-1", showFavoritesOnly ? "fill-current" : "")} />
                                <span className="hidden sm:inline">Favoritos</span>
                            </Button>
                        }
                    />
                    <ViewEmptyState
                        mode="no-results"
                        icon={FileText}
                        viewName="registros de bitácora"
                        filterContext="con los filtros aplicados"
                        onResetFilters={filters.clearAll}
                        totalCount={allLogs.length}
                    />
                </div>
            </>
        );
    }

    // === RENDER ===
    return (
        <>
        {headerAction}

        <div className="flex flex-col flex-1 min-h-0 h-full space-y-4">
            {/* Toolbar */}
            <ToolbarCard
                filters={filters}
                searchPlaceholder="Buscar en bitácora..."
                display={{
                    viewMode,
                    onViewModeChange: (v) => setViewMode(v as ViewMode),
                    viewModeOptions: VIEW_OPTIONS,
                }}
                right={
                    <Button
                        variant={showFavoritesOnly ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={cn("h-8 px-3 border-dashed", showFavoritesOnly && "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20")}
                    >
                        <Star className={cn("h-4 w-4 mr-1", showFavoritesOnly ? "fill-current" : "")} />
                        <span className="hidden sm:inline">Favoritos</span>
                    </Button>
                }
            />

            {/* Content */}
            {viewMode === "feed" ? (
                <SitelogFeed
                    logs={filteredLogs}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showProjectName={showProjectColumn}
                    parameters={sitelogParameters}
                    onUpdateField={handleUpdateField}
                    logTypes={initialTypes}
                    projectOptions={projectOptions}
                />
            ) : (
                <DataTable
                    columns={columns}
                    data={filteredLogs}
                    enableContextMenu
                    onEdit={(row) => handleEdit(row)}
                    onDelete={(row) => handleDelete(row)}
                    parameters={sitelogParameters}
                />
            )}
        </div>

        <DeleteConfirmDialog />
        </>
    );
}
