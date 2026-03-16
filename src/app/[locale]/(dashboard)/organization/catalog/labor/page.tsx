import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { getLaborTypesWithPrices } from "@/features/labor/actions";
import { getCurrencies } from "@/features/billing/queries";
import { LaborTypesView } from "@/features/labor/views/labor-types-view";
import { ErrorDisplay } from "@/components/ui/error-display";

export const metadata: Metadata = {
    title: "Mano de Obra | Catálogo Técnico | Seencel",
    description: "Tipos de mano de obra y precios",
    robots: "noindex, nofollow",
};

export default async function CatalogLaborPage() {
    try {
        const { orgId } = await requireAuthContext();

        const [laborTypesWithPrices, currencies] = await Promise.all([
            getLaborTypesWithPrices(orgId),
            getCurrencies(),
        ]);

        const defaultCurrencyId = currencies[0]?.id || '';

        return (
            <LaborTypesView
                laborTypes={laborTypesWithPrices}
                currencies={currencies}
                orgId={orgId}
                defaultCurrencyId={defaultCurrencyId}
            />
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar mano de obra"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
