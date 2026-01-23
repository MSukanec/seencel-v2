"use client";

import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { FileText, BarChart2, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { SiteLog, SiteLogType } from "@/types/sitelog";
import { SiteLogTypesManager } from "./sitelog-types-manager";
import { EmptyState } from "@/components/ui/empty-state";
import { SitelogFeed } from "./sitelog-feed";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { Star, Circle, Activity, AlertTriangle, HelpCircle } from "lucide-react";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { useModal } from "@/providers/modal-store";
import { SitelogForm } from "./sitelog-form";
import { deleteSiteLog } from "@/actions/sitelog";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";

interface SitelogShellProps {
    projectId: string;
    organizationId: string;
    initialTypes: SiteLogType[];
    initialLogs: SiteLog[];
}

export function SitelogShell({ projectId, organizationId, initialTypes, initialLogs }: SitelogShellProps) {
    const t = useTranslations('Sitelog');
    const [searchQuery, setSearchQuery] = useState("");

    // Filters State (Multi-select)
    const [severityFilter, setSeverityFilter] = useState<Set<string>>(new Set());
    const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    const { openModal, closeModal } = useModal();

    // Placeholder for create action - user logic will determine when to show this
    const canCreateLog = true; // Logic: canCreate(user, 'sitelog')

    // Standard tab trigger style from ContactsPage
    const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

    // Client-side filtering
    const filteredLogs = useMemo(() => {
        let logs = initialLogs;

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
    }, [initialLogs, searchQuery, severityFilter, typeFilter, showFavoritesOnly]);

    const handleCreate = () => {
        // ... same as before
        openModal(
            <SitelogForm
                organizationId={organizationId}
                projectId={projectId}
                descriptionType={initialTypes}
                onSuccess={closeModal}
            />,
            {
                title: "Nuevo registro de bitácora",
                description: "Completa los detalles del día. Puedes adjuntar fotos y documentos más tarde.",
                size: 'md'
            }
        );
    };

    // Action State (same)
    const [logToDelete, setLogToDelete] = useState<SiteLog | null>(null);

    // ... handlers (handleEdit, handleDeleteClick, confirmDelete, handleToggleFavorite) same as before

    const handleEdit = (log: SiteLog) => {
        openModal(
            <SitelogForm
                organizationId={organizationId}
                projectId={projectId}
                descriptionType={initialTypes}
                initialData={log}
                onSuccess={closeModal}
            />,
            {
                title: "Editar registro",
                description: "Modifica los detalles del registro.",
                size: 'md'
            }
        );
    };

    const handleDeleteClick = (log: SiteLog) => {
        setLogToDelete(log);
    };

    const confirmDelete = async () => {
        if (!logToDelete) return;

        try {
            const result = await deleteSiteLog(logToDelete.id, projectId);
            if (result.error) {
                // You might need a toast here, checking if toast is imported
                console.error(result.error);
            }
            // Success is handled by revalidatePath usually, but we can close modal
        } catch (error) {
            console.error(error);
        }
        setLogToDelete(null);
    };

    const handleToggleFavorite = async (log: SiteLog) => {
        // TODO: Implement toggle favorite mutation here
        console.log("Toggling favorite:", log.id, !log.is_favorite);
    };

    const severityOptions = [
        { label: 'Baja', value: 'low', icon: Circle },
        { label: 'Media', value: 'medium', icon: Activity },
        { label: 'Alta', value: 'high', icon: AlertTriangle },
    ];

    const typeOptions = initialTypes.map(t => ({
        label: t.name,
        value: t.id,
        icon: HelpCircle // Placeholder icon if type doesn't have one
    }));

    return (
        <>
            <Tabs defaultValue="entries" className="w-full h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={t('title')}
                    icon={<FileText />}
                    tabs={
                        // ... same tabs list
                        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                            <TabsTrigger value="entries" className={cn(tabTriggerClass, "gap-2")}>
                                <FileText className="h-4 w-4" />
                                {t('tabs.entries')}
                            </TabsTrigger>
                            <TabsTrigger value="reports" className={cn(tabTriggerClass, "gap-2")}>
                                <BarChart2 className="h-4 w-4" />
                                {t('tabs.reports')}
                            </TabsTrigger>
                            <TabsTrigger value="settings" className={cn(tabTriggerClass, "gap-2")}>
                                <Settings className="h-4 w-4" />
                                {t('tabs.settings')}
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    <ContentLayout variant="wide" className="[scrollbar-gutter:stable]">
                        <TabsContent value="entries" className="mt-0 h-full space-y-6">
                            {/* Toolbar Area - Hidden on mobile (mobile uses floating buttons) */}
                            <Card className="hidden md:block p-4 border-dashed bg-card/50">
                                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                    <div className="flex-1 w-full sm:w-auto">
                                        <Toolbar
                                            searchQuery={searchQuery}
                                            onSearchChange={setSearchQuery}
                                            searchPlaceholder="Buscar en bitácora..."
                                            // mobileActionClick={handleCreate}
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
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                                                <Button disabled={!canCreateLog} onClick={handleCreate} size="sm">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Crear registro
                                                </Button>
                                            </div>
                                        </Toolbar>
                                    </div>
                                </div>
                            </Card>

                            {/* Mobile Toolbar - Rendered via Portal by Toolbar component */}
                            <div className="md:hidden">
                                <Toolbar
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                    searchPlaceholder="Buscar en bitácora..."
                                    // mobileActionClick={handleCreate}
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
                                />
                            </div>

                            <SitelogFeed
                                logs={filteredLogs}
                                onEdit={handleEdit}
                                onDelete={handleDeleteClick}
                                onToggleFavorite={handleToggleFavorite}
                            />
                        </TabsContent>

                        <TabsContent value="settings" className="mt-0 h-full">
                            <div className="space-y-6">
                                <SiteLogTypesManager
                                    organizationId={organizationId}
                                    initialTypes={initialTypes}
                                />
                            </div>
                        </TabsContent>
                    </ContentLayout>
                </PageWrapper>
            </Tabs>

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

