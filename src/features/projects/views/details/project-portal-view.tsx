"use client";

import { ClientPortalConfig } from "@/features/clients/components/portal/client-portal-config";
import { ClientPortalAccess } from "@/features/clients/components/portal/client-portal-access";
import { ContentLayout } from "@/components/layout";
import type { PortalSettings } from "@/features/clients/actions";

// ============================================================================
// Types
// ============================================================================

interface ProjectPortalViewProps {
    projectId: string;
    organizationId: string;
    portalSettings: PortalSettings | null;
    clients: any[];
    canCustomize: boolean;
}

// ============================================================================
// View Component
// ============================================================================

export function ProjectPortalView({
    projectId,
    organizationId,
    portalSettings,
    clients,
    canCustomize,
}: ProjectPortalViewProps) {
    return (
        <div className="h-full overflow-y-auto">
            <ContentLayout variant="full">
                <div className="space-y-8">
                    {/* Portal Design & Configuration */}
                    <ClientPortalConfig
                        projectId={projectId}
                        organizationId={organizationId}
                        initialSettings={portalSettings}
                        canCustomize={canCustomize}
                    />

                    {/* Portal Access Links */}
                    <ContentLayout variant="narrow">
                        <ClientPortalAccess
                            projectId={projectId}
                            clients={clients}
                        />
                    </ContentLayout>
                </div>
            </ContentLayout>
        </div>
    );
}
