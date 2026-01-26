import { getUserOrganizations } from "@/features/organization/queries";
import { getQuote, getQuoteItems, getChangeOrdersByContract, getContractSummary } from "@/features/quotes/queries";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, FilePlus2, ChevronLeft } from "lucide-react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationTasks, getUnits, getTaskDivisions } from "@/features/tasks/queries";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Views
import { QuoteBaseView } from "@/features/quotes/views/quote-base-view";
import { QuoteChangeOrdersView } from "@/features/quotes/views/quote-change-orders-view";
import { QuoteOverviewView } from "@/features/quotes/views/quote-overview-view";

interface PageProps {
    params: Promise<{ quoteId: string }>;
    searchParams?: Promise<{ view?: string }>;
}

const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

export default async function QuoteDetailPage({ params, searchParams }: PageProps) {
    const { quoteId } = await params;
    const { view } = (await searchParams) || {};
    const defaultTab = view || "overview";

    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        redirect("/");
    }

    // 1. Fetch quote base data (Server Side Data Fetching)
    const quote = await getQuote(quoteId);

    if (!quote || quote.organization_id !== activeOrgId) {
        notFound();
    }

    const supabase = await createClient();

    // 2. Parallel Data Fetching for dependencies
    const promises: any[] = [
        getQuoteItems(quoteId),
        getOrganizationTasks(activeOrgId),
        getUnits(),
        getTaskDivisions(),
        supabase.from("currencies").select("id, name, symbol").order("name"),
    ];

    const isContract = quote.quote_type === 'contract';

    // If it's a contract, we need extra data for the Change Orders tab/summary
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

    let changeOrders = [];
    let contractSummary = null;

    if (isContract) {
        changeOrders = results[5];
        contractSummary = results[6];
    }

    return (
        <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title={
                    quote.quote_type === 'change_order' && quote.parent_contract_name ? (
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Link
                                href={`/organization/quotes/${quote.parent_quote_id}?view=change_orders`}
                                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px] md:max-w-none hover:underline"
                            >
                                {quote.parent_contract_name}
                            </Link>
                            <span className="text-muted-foreground">/</span>
                            <span className="truncate">{quote.name}</span>
                        </div>
                    ) : quote.name
                }
                icon={<FileText />}
                backButton={
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 mr-2">
                        <Link href={
                            quote.quote_type === 'change_order' && quote.parent_quote_id
                                ? `/organization/quotes/${quote.parent_quote_id}?view=change_orders`
                                : "/organization/quotes"
                        }>
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
                        {isContract && (
                            <TabsTrigger value="change_orders" className={tabTriggerClass}>
                                Adicionales
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
                <div className="flex-1 overflow-hidden">
                    <ContentLayout variant="wide">
                        {/* Tab Content: Overview */}
                        <TabsContent value="overview" className="mt-0 h-full overflow-y-auto pr-2">
                            <QuoteOverviewView
                                quote={quote}
                                contractSummary={contractSummary}
                            />
                        </TabsContent>

                        {/* Tab Content: Items (Base View) */}
                        <TabsContent value="items" className="mt-0 h-full flex flex-col min-h-0">
                            <QuoteBaseView
                                quote={quote}
                                items={items}
                                tasks={tasks}
                                units={units}
                                divisions={divisions}
                                currencies={currencies}
                            />
                        </TabsContent>

                        {/* Tab Content: Change Orders View */}
                        {isContract && (
                            <TabsContent value="change_orders" className="mt-0 h-full overflow-y-auto pr-2">
                                <QuoteChangeOrdersView
                                    contract={quote}
                                    changeOrders={changeOrders}
                                    currencies={currencies}
                                />
                            </TabsContent>
                        )}
                    </ContentLayout>
                </div>
            </PageWrapper>
        </Tabs>
    );
}
