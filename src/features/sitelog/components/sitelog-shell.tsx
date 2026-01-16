"use client";

import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { FileText, BarChart2, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { SiteLog, SiteLogType } from "@/types/sitelog";
import { SiteLogTypesManager } from "./sitelog-types-manager";
import { EmptyState } from "@/components/ui/empty-state";
import { SitelogFeed } from "./sitelog-feed";
import { Button } from "@/components/ui/button";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Toolbar } from "@/components/ui/toolbar";
import { useModal } from "@/providers/modal-store";
import { SitelogForm } from "./sitelog-form";

interface SitelogShellProps {
    projectId: string; // Kept for future use if needed
    organizationId: string;
    initialTypes: SiteLogType[];
    initialLogs: SiteLog[];
}

export function SitelogShell({ projectId, organizationId, initialTypes, initialLogs }: SitelogShellProps) {
    const t = useTranslations('Sitelog');
    const [searchQuery, setSearchQuery] = useState("");
    const { openModal, closeModal } = useModal();

    // Placeholder for create action - user logic will determine when to show this
    const canCreateLog = true; // Logic: canCreate(user, 'sitelog')

    // Standard tab trigger style from ContactsPage
    const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

    // Client-side filtering
    const filteredLogs = useMemo(() => {
        if (!searchQuery) return initialLogs;
        const lowerQ = searchQuery.toLowerCase();
        return initialLogs.filter(log =>
            (log.comments?.toLowerCase().includes(lowerQ)) ||
            (log.author?.user?.full_name?.toLowerCase().includes(lowerQ)) ||
            (log.entry_type?.name.toLowerCase().includes(lowerQ))
        );
    }, [initialLogs, searchQuery]);

    const handleCreate = () => {
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

    return (
        <Tabs defaultValue="entries" className="w-full h-full flex flex-col">
            <PageWrapper
                type="page"
                title={t('title')}
                icon={<FileText />}
                tabs={
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
                <ContentLayout variant="wide">
                    <TabsContent value="entries" className="mt-0 h-full space-y-6">
                        {/* Toolbar Area */}
                        <div className="flex flex-col gap-4">
                            <Toolbar
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                searchPlaceholder="Buscar en bitácora..."
                            >
                                <Button disabled={!canCreateLog} onClick={handleCreate}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Crear registro
                                </Button>
                            </Toolbar>
                        </div>

                        <SitelogFeed logs={filteredLogs} />
                    </TabsContent>

                    <TabsContent value="reports" className="mt-0 h-full">
                        <EmptyState
                            title={t('reports.emptyTitle')}
                            description={t('reports.emptyDescription')}
                            icon={BarChart2}
                            variant="dashed"
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
    );
}
