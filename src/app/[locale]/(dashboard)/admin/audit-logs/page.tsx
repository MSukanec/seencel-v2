import { PageHeader } from "@/components/layout/page-header";
import { getAllActivityLogs } from "@/actions/admin-actions";
import { AdminActivityLogsDataTable } from "@/components/admin/admin-activity-logs-data-table";

export default async function AdminAuditLogsPage() {
    const logs = await getAllActivityLogs(500);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Registros de Actividad"
                description="Logs de actividad de todas las organizaciones."
            />
            <AdminActivityLogsDataTable data={logs} />
        </div>
    );
}
