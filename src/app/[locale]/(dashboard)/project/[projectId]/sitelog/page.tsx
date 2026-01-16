import { setRequestLocale } from 'next-intl/server';
import { SitelogShell } from '@/features/sitelog/components/sitelog-shell';
import { getActiveOrganizationId } from "@/actions/general-costs";
import { getSiteLogTypes, getSiteLogs } from "@/actions/sitelog";

interface Props {
    params: Promise<{
        locale: string;
        projectId: string;
    }>;
}

export default async function SitelogPage({ params }: Props) {
    const { locale, projectId } = await params;
    setRequestLocale(locale);

    const organizationId = await getActiveOrganizationId();
    if (!organizationId) return null;
    // Use types (getSiteLogTypes) AND logs (getSiteLogs)
    const [types, logs] = await Promise.all([
        getSiteLogTypes(organizationId),
        getSiteLogs(projectId)
    ]);

    return (
        <SitelogShell
            projectId={projectId}
            organizationId={organizationId}
            initialTypes={types}
            initialLogs={logs}
        />
    );
}
