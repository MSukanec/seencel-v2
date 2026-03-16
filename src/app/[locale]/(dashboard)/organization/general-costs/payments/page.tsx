import { requireAuthContext } from "@/lib/auth";
import { ErrorDisplay } from "@/components/ui/error-display";
import { getGeneralCostPayments, getGeneralCosts } from "@/features/general-costs/actions";
import { getOrganizationFinancialData } from "@/features/organization/queries";
import { GeneralCostsPaymentsView } from "@/features/general-costs/views/general-costs-payments-view";

export default async function GeneralCostsPaymentsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { orgId: organizationId } = await requireAuthContext();
    const params = await searchParams;
    const initialSearchQuery = params.q || "";

    try {
        const [payments, concepts, financialData] = await Promise.all([
            getGeneralCostPayments(organizationId),
            getGeneralCosts(organizationId),
            getOrganizationFinancialData(organizationId),
        ]);

        const wallets = financialData.wallets.map(w => ({ id: w.id, wallet_name: w.name }));
        const currencies = financialData.currencies.map(c => ({ id: c.id, name: c.name, code: c.code, symbol: c.symbol }));

        return (
            <GeneralCostsPaymentsView
                data={payments}
                concepts={concepts}
                wallets={wallets}
                currencies={currencies}
                organizationId={organizationId}
                initialSearchQuery={initialSearchQuery}
            />
        );
    } catch (error) {
        console.error("Error loading general costs payments:", error);
        return (
            <ErrorDisplay
                title="Error al cargar los pagos"
                message="Ocurrió un error al cargar los datos. Intentá recargar la página."
                retryLabel="Reintentar"
            />
        );
    }
}
