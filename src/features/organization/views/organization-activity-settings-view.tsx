"use client";

import { OrganizationActivityLog } from "@/types/organization";
import { ActivityLogsDataTable } from "../components/settings/activity-logs-data-table";
import { ContentLayout } from "@/components/layout";
import { useTranslations } from "next-intl";

interface ActivitySettingsViewProps {
    logs: OrganizationActivityLog[];
}

export function ActivitySettingsView({ logs = [] }: ActivitySettingsViewProps) {
    const t = useTranslations("ActivityLogs");

    return (
        <ContentLayout variant="wide">
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">{t('title')}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t('subtitle')}
                    </p>
                </div>

                <ActivityLogsDataTable data={logs} />
            </div>
        </ContentLayout>
    );
}
