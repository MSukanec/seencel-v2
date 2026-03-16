import { requireAuthContext } from "@/lib/auth";
import { ErrorDisplay } from "@/components/ui/error-display";
import { getGeneralCosts, getGeneralCostConceptStats, getGeneralCostCategories } from "@/features/general-costs/actions";
import { GeneralCostsConceptsView } from "@/features/general-costs/views/general-costs-concepts-view";

export default async function GeneralCostsConceptsPage() {
    const { orgId: organizationId } = await requireAuthContext();

    try {
        const [concepts, conceptStats, categories] = await Promise.all([
            getGeneralCosts(organizationId),
            getGeneralCostConceptStats(organizationId),
            getGeneralCostCategories(organizationId),
        ]);

        return (
            <GeneralCostsConceptsView
                data={concepts}
                conceptStats={conceptStats}
                categories={categories}
                organizationId={organizationId}
            />
        );
    } catch (error) {
        console.error("Error loading general costs concepts:", error);
        return (
            <ErrorDisplay
                title="Error al cargar los conceptos"
                message="Ocurrió un error al cargar los datos. Intentá recargar la página."
                retryLabel="Reintentar"
            />
        );
    }
}
