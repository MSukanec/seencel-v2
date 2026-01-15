import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";
import { getAllActivityLogs } from "@/actions/admin-actions";
import { AdminActivityLogsDataTable } from "@/features/admin/components/admin-activity-logs-data-table";
import { FileText } from "lucide-react";

export default async function AdminAuditLogsPage() {
    const logs = await getAllActivityLogs(500);

    return (
        <PageWrapper type="page" title="Actividad" icon={<FileText />}>
            <ContentLayout variant="wide">
                <AdminActivityLogsDataTable data={logs} />
            </ContentLayout>
        </PageWrapper>
    );
}
