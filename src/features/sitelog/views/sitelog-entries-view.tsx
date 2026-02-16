"use client";

import { useState, useMemo } from "react";
import { Plus, Star, Circle, Activity, AlertTriangle, HelpCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { useModal } from "@/stores/modal-store";
import { useActiveProjectId } from "@/stores/layout-store";
import { useRouter } from "@/i18n/routing";

import { SiteLog, SiteLogType } from "../types";
import { deleteSiteLog } from "../actions";
import { SitelogEntryForm } from "../forms/sitelog-entry-form";
import { SitelogFeed } from "../components/sitelog-feed";
import { toast } from "sonner";

interface SitelogEntriesViewProps {
    organizationId: string;
    initialLogs: SiteLog[];
    initialTypes: SiteLogType[];
}

export function SitelogEntriesView({ organizationId, initialLogs, initialTypes }: SitelogEntriesViewProps) {
    const router = useRouter();
    const { openModal } = useModal();

    // Project filter from global store (org-wide mode)
    const activeProjectId = useActiveProjectId();

    // Filters State
    const [searchQuery, setSearchQuery] = useState("");
    const [severityFilter, setSeverityFilter] = useState<Set<string>>(new Set());
    const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    // Optimistic delete via local state
    const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());


    // Client-side filtering
    const filteredLogs = useMemo(() => {
        let logs = initialLogs.filter(l => !removedIds.has(l.id));

        // Project Filter (org-wide mode)
        if (activeProjectId) {
            logs = logs.filter(log => log.project_id === activeProjectId);
        }

        // Search Filter
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            logs = logs.filter(log =>
                (log.comments?.toLowerCase().includes(lowerQ)) ||
                (log.author?.user?.full_name?.toLowerCase().includes(lowerQ)) ||
                (log.entry_type?.name.toLowerCase().includes(lowerQ))
            );
        }

        // Severity Filter
        if (severityFilter.size > 0) {
            logs = logs.filter(log => log.severity && severityFilter.has(log.severity));
        }

        // Type Filter
        if (typeFilter.size > 0) {
            logs = logs.filter(log => log.entry_type_id && typeFilter.has(log.entry_type_id));
        }

        // Favorites Filter
        if (showFavoritesOnly) {
            logs = logs.filter(log => log.is_favorite);
        }

        return logs;
    }, [initialLogs, removedIds, activeProjectId, searchQuery, severityFilter, typeFilter, showFavoritesOnly]);

    // Determine empty state mode
    const hasAnyLogs = initialLogs.filter(l => !removedIds.has(l.id)).length > 0;
    const hasActiveFilters = searchQuery || severityFilter.size > 0 || typeFilter.size > 0 || showFavoritesOnly;

    const handleCreate = () => {
        openModal(
            <SitelogEntryForm
                organizationId={organizationId}
                projectId={activeProjectId ?? undefined}
                descriptionType={initialTypes}
            />,
            {
                title: "Nuevo registro de bitácora",
                description: "Completa los detalles del día. Puedes adjuntar fotos y documentos más tarde.",
                size: 'md'
            }
        );
    };

    const handleEdit = (log: SiteLog) => {
        openModal(
            <SitelogEntryForm
                organizationId={organizationId}
                projectId={log.project_id}
                descriptionType={initialTypes}
                initialData={log}
            />,
            {
                title: "Editar registro",
                description: "Modifica los detalles del registro.",
                size: 'md'
            }
        );
    };

    // Delete with optimistic UI
    const [logToDelete, setLogToDelete] = useState<SiteLog | null>(null);

    const confirmDelete = async () => {
        if (!logToDelete) return;

        // Optimistic: remove immediately
        setRemovedIds(prev => new Set(prev).add(logToDelete.id));
        setLogToDelete(null);
        toast.success("Registro eliminado");

        // Background: submit to server
        try {
            const result = await deleteSiteLog(logToDelete.id, logToDelete.project_id);
            if (result.error) {
                toast.error("Error al eliminar");
                router.refresh(); // Rollback
            }
        } catch (error) {
            toast.error("Error al eliminar");
            router.refresh(); // Rollback
        }
    };

    const handleResetFilters = () => {
        setSearchQuery("");
        setSeverityFilter(new Set());
        setTypeFilter(new Set());
        setShowFavoritesOnly(false);
    };

    const severityOptions = [
        { label: 'Baja', value: 'low', icon: Circle },
        { label: 'Media', value: 'medium', icon: Activity },
        { label: 'Alta', value: 'high', icon: AlertTriangle },
    ];

    const typeOptions = initialTypes.map(t => ({
        label: t.name,
        value: t.id,
        icon: HelpCircle
    }));

    // Empty state: no logs at all
    if (!hasAnyLogs) {
        return (
            <div className="flex flex-col flex-1 min-h-0 h-full">
                <Toolbar
                    portalToHeader
                    actions={[{
                        label: "Crear registro",
                        icon: Plus,
                        onClick: handleCreate,
                    }]}
                />
                <ViewEmptyState
                    mode="empty"
                    icon={FileText}
                    viewName="Bitácora de Obra"
                    featureDescription="La bitácora de obra registra las actividades diarias, incidencias, condiciones climáticas y avances de tus proyectos de construcción."
                    onAction={handleCreate}
                    actionLabel="Crear registro"
                />
            </div>
        );
    }

    // Empty state: filters active but no results
    if (filteredLogs.length === 0 && hasActiveFilters) {
        return (
            <div className="flex flex-col flex-1 min-h-0 h-full">
                <Toolbar
                    portalToHeader
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Buscar en bitácora..."
                    filterContent={
                        <>
                            <FacetedFilter
                                title="Severidad"
                                options={severityOptions}
                                selectedValues={severityFilter}
                                onSelect={(value) => {
                                    const next = new Set(severityFilter);
                                    if (next.has(value)) next.delete(value);
                                    else next.add(value);
                                    setSeverityFilter(next);
                                }}
                                onClear={() => setSeverityFilter(new Set())}
                            />
                            <FacetedFilter
                                title="Tipo"
                                options={typeOptions}
                                selectedValues={typeFilter}
                                onSelect={(value) => {
                                    const next = new Set(typeFilter);
                                    if (next.has(value)) next.delete(value);
                                    else next.add(value);
                                    setTypeFilter(next);
                                }}
                                onClear={() => setTypeFilter(new Set())}
                            />
                        </>
                    }
                    actions={[{
                        label: "Crear registro",
                        icon: Plus,
                        onClick: handleCreate,
                    }]}
                />
                <ViewEmptyState
                    mode="no-results"
                    icon={FileText}
                    viewName="registros de bitácora"
                    filterContext="con los filtros aplicados"
                    onResetFilters={handleResetFilters}
                />
            </div>
        );
    }

    return (
        <>
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar en bitácora..."
                filterContent={
                    <>
                        <FacetedFilter
                            title="Severidad"
                            options={severityOptions}
                            selectedValues={severityFilter}
                            onSelect={(value) => {
                                const next = new Set(severityFilter);
                                if (next.has(value)) next.delete(value);
                                else next.add(value);
                                setSeverityFilter(next);
                            }}
                            onClear={() => setSeverityFilter(new Set())}
                        />

                        <FacetedFilter
                            title="Tipo"
                            options={typeOptions}
                            selectedValues={typeFilter}
                            onSelect={(value) => {
                                const next = new Set(typeFilter);
                                if (next.has(value)) next.delete(value);
                                else next.add(value);
                                setTypeFilter(next);
                            }}
                            onClear={() => setTypeFilter(new Set())}
                        />

                        <Button
                            variant={showFavoritesOnly ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            className={cn("h-9 px-3 border-dashed", showFavoritesOnly && "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20")}
                        >
                            <Star className={cn("h-4 w-4 mr-1", showFavoritesOnly ? "fill-current" : "")} />
                            <span className="hidden sm:inline">Favoritos</span>
                        </Button>
                    </>
                }
                actions={[{
                    label: "Crear registro",
                    icon: Plus,
                    onClick: handleCreate,
                }]}
            />

            <SitelogFeed
                logs={filteredLogs}
                onEdit={handleEdit}
                onDelete={(log) => setLogToDelete(log)}
                showProjectName={!activeProjectId}
            />

            <DeleteConfirmationDialog
                open={!!logToDelete}
                onOpenChange={(open) => !open && setLogToDelete(null)}
                onConfirm={confirmDelete}
                title="Eliminar registro"
                description="¿Estás seguro de que deseas eliminar este registro de la bitácora? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
            />
        </>
    );
}
