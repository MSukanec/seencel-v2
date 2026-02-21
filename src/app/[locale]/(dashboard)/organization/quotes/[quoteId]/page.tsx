import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getUserOrganizations } from "@/features/organization/queries";
import { getQuote, getQuoteItems, getChangeOrdersByContract, getContractSummary } from "@/features/quotes/queries";
import { getOrganizationTasks, getUnits, getTaskDivisions } from "@/features/tasks/queries";
import { createClient } from "@/lib/supabase/server";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { FileText, ChevronLeft } from "lucide-react";

// Views
import { QuoteBaseView } from "@/features/quotes/views/quote-base-view";
import { QuoteChangeOrdersView } from "@/features/quotes/views/quote-change-orders-view";
import { QuoteOverviewView } from "@/features/quotes/views/quote-overview-view";
import { QuoteAnalyticsView } from "@/features/quotes/views/quote-analytics-view";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Presupuesto | SEENCEL",
        description: "Detalle de presupuesto o contrato",
        robots: "noindex, nofollow",
    };
}

const tabTriggerClass =
    "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

export default async function QuoteDetailAppPage({
    params,
    searchParams,
}: {
    params: Promise<{ quoteId: string; locale: string }>;
    searchParams?: Promise<{ view?: string }>;
}) {
    const { quoteId } = await params;
    const { view } = (await searchParams) || {};
    const defaultTab = view || "overview";

    const { activeOrgId } = await getUserOrganizations();
    if (!activeOrgId) {
        redirect("/");
    }

    try {
        // 1. Fetch quote base data
        const quote = await getQuote(quoteId);

        if (!quote || quote.organization_id !== activeOrgId) {
            notFound();
        }

        // After notFound(), quote is guaranteed to be non-null
        // TypeScript needs this assertion since notFound() doesn't narrow the type
        const safeQuote = quote!;

        const supabase = await createClient();
        const isContract = safeQuote.quote_type === "contract";

        // 2. Parallel fetch for all dependencies
        const promises: any[] = [
            getQuoteItems(quoteId),
            getOrganizationTasks(activeOrgId),
            getUnits(),
            getTaskDivisions(),
            supabase.schema("finance").from("currencies").select("id, name, symbol").order("name"),
        ];

        if (isContract) {
            promises.push(getChangeOrdersByContract(quoteId));
            promises.push(getContractSummary(quoteId));
        }

        const results = await Promise.all(promises);

        const items = results[0];
        const tasks = results[1].data || [];
        const units = results[2].data || [];
        const divisions = results[3].data || [];
        const currencies = results[4].data || [];
        const changeOrders = isContract ? results[5] : [];
        const contractSummary = isContract ? results[6] : null;

        return (
            <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={
                        quote.quote_type === "change_order" && quote.parent_contract_name ? (
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Link
                                    href={{
                                        pathname: "/organization/quotes/[quoteId]",
                                        params: { quoteId: quote.parent_quote_id! },
                                        query: { view: "change_orders" },
                                    }}
                                    className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px] md:max-w-none hover:underline"
                                >
                                    {quote.parent_contract_name}
                                </Link>
                                <span className="text-muted-foreground">/</span>
                                <span className="truncate">{quote.name}</span>
                            </div>
                        ) : (
                            quote.name
                        )
                    }
                    icon={<FileText />}
                    backButton={
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 mr-2">
                            <Link
                                href={
                                    quote.quote_type === "change_order" && quote.parent_quote_id
                                        ? {
                                            pathname: "/organization/quotes/[quoteId]" as const,
                                            params: { quoteId: quote.parent_quote_id },
                                            query: { view: "change_orders" },
                                        }
                                        : "/organization/quotes"
                                }
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                    }
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                            <TabsTrigger value="overview" className={tabTriggerClass}>
                                Resumen
                            </TabsTrigger>
                            <TabsTrigger value="items" className={tabTriggerClass}>
                                Ítems
                            </TabsTrigger>
                            <TabsTrigger value="analytics" className={tabTriggerClass}>
                                Analítica
                            </TabsTrigger>
                            {isContract && (
                                <TabsTrigger value="change_orders" className={tabTriggerClass}>
                                    Órdenes de Cambio
                                    {changeOrders.length > 0 && (
                                        <span className="ml-1 bg-muted-foreground/20 text-xs px-1.5 py-0.5 rounded-full">
                                            {changeOrders.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                            )}
                        </TabsList>
                    }
                >
                    <TabsContent
                        value="overview"
                        className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden"
                    >
                        <ContentLayout variant="wide" className="h-full overflow-y-auto">
                            <QuoteOverviewView
                                quote={quote}
                                contractSummary={contractSummary}
                                items={items}
                            />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent
                        value="items"
                        className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden"
                    >
                        <ContentLayout variant="wide" className="h-full overflow-y-auto">
                            <QuoteBaseView
                                quote={quote}
                                items={items}
                                tasks={tasks}
                                units={units}
                                divisions={divisions}
                                currencies={currencies}
                            />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent
                        value="analytics"
                        className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden"
                    >
                        <ContentLayout variant="wide" className="h-full overflow-y-auto">
                            <QuoteAnalyticsView
                                quote={quote}
                                contractSummary={contractSummary}
                                items={items}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {isContract && (
                        <TabsContent
                            value="change_orders"
                            className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden"
                        >
                            <ContentLayout variant="wide" className="h-full overflow-y-auto">
                                <QuoteChangeOrdersView
                                    contract={quote}
                                    changeOrders={changeOrders}
                                    currencies={currencies}
                                />
                            </ContentLayout>
                        </TabsContent>
                    )}
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar el presupuesto"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
