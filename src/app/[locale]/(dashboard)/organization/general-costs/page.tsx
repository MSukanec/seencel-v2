import { requireAuthContext } from "@/lib/auth";
import { ErrorDisplay } from "@/components/ui/error-display";
import { getGeneralCostsDashboard, getGeneralCostPayments } from "@/features/general-costs/actions";
import { GeneralCostsDashboardView } from "@/features/general-costs/views/general-costs-dashboard-view";

export default async function GeneralCostsOverviewPage() {
    const { orgId: organizationId } = await requireAuthContext();

    try {
        const [dashboardData, payments] = await Promise.all([
            getGeneralCostsDashboard(organizationId),
            getGeneralCostPayments(organizationId),
        ]);

        return <GeneralCostsDashboardView data={dashboardData} payments={payments} />;
    } catch (error) {
        console.error("Error loading general costs dashboard:", error);
        return (
            <ErrorDisplay
                title="Error al cargar el dashboard"
                message="Ocurrió un error al cargar los datos. Intentá recargar la página."
                retryLabel="Reintentar"
            />
        );
    }
}
