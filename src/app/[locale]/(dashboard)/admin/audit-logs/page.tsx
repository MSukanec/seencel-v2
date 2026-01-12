import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";
import { getAllActivityLogs } from "@/actions/admin-actions";
import { AdminActivityLogsDataTable } from "@/components/admin/admin-activity-logs-data-table";

export default async function AdminAuditLogsPage() {
    const logs = await getAllActivityLogs(500);

    return (
        <PageWrapper type="page" title="Actividad">
            <ContentLayout variant="wide">
                <AdminActivityLogsDataTable data={logs} />
            </ContentLayout>
        </PageWrapper>
    );
}
