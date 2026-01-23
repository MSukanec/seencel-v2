"use client";

import { OrganizationActivityLog } from "@/types/organization";
import { ActivityLogsDataTable } from "./activity-logs-data-table";
import { useTranslations } from "next-intl";

interface ActivityTabProps {
    logs: OrganizationActivityLog[];
}

export function ActivityTab({ logs = [] }: ActivityTabProps) {
    const t = useTranslations("ActivityLogs");

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold tracking-tight">{t('title')}</h2>
                <p className="text-sm text-muted-foreground">
                    {t('subtitle')}
                </p>
            </div>

            <ActivityLogsDataTable data={logs} />
        </div>
    );
}

