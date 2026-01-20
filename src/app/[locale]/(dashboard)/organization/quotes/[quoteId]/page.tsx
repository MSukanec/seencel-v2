import { getUserOrganizations } from "@/features/organization/queries";
import { getQuote, getQuoteItems } from "@/features/quotes/queries";
import { QuoteEditor } from "@/features/quotes/components/editor/quote-editor";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";
import { FileText } from "lucide-react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationTasks, getUnits, getTaskDivisions } from "@/features/tasks/queries";

interface PageProps {
    params: Promise<{ quoteId: string }>;
}

export default async function QuoteDetailPage({ params }: PageProps) {
    const { quoteId } = await params;
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        redirect("/");
    }

    // Fetch quote data
    const quote = await getQuote(quoteId);

    if (!quote || quote.organization_id !== activeOrgId) {
        notFound();
    }

    const supabase = await createClient();

    // Fetch items and related data in parallel
    const [items, tasksResult, unitsResult, divisionsResult, currenciesResult] = await Promise.all([
        getQuoteItems(quoteId),
        getOrganizationTasks(activeOrgId),
        getUnits(),
        getTaskDivisions(activeOrgId),
        supabase.from("currencies").select("id, name, symbol").order("name"),
    ]);

    const currencies = currenciesResult.data || [];
    const tasks = tasksResult.data || [];
    const units = unitsResult.data || [];
    const divisions = divisionsResult.data || [];

    return (
        <PageWrapper
            type="page"
            title={quote.name}
            icon={<FileText />}
        >
            <ContentLayout variant="wide" className="pb-6">
                <QuoteEditor
                    quote={quote}
                    items={items}
                    tasks={tasks}
                    units={units}
                    divisions={divisions}
                    currencies={currencies}
                />
            </ContentLayout>
        </PageWrapper>
    );
}
