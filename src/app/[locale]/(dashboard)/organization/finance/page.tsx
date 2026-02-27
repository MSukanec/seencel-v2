import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getFinancialMovements } from "@/features/organization/queries";
import { getActiveOrganizationId } from "@/features/general-costs/actions";
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { getClientsByOrganization } from "@/features/clients/queries";
import { DollarSign } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Views - imported directly without intermediary
import { FinancesOverviewView } from "@/features/finance/views/finances-overview-view";
import { FinancesMovementsView } from "@/features/finance/views/finances-movements-view";
import { FinancesSettingsView } from "@/features/finance/views/finances-settings-view";
import { FinancesCapitalView } from "@/features/finance/views/finances-capital-view";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'MegaMenu.Finance' });
    return {
        title: `${t('title')} | Seencel`,
        description: t('description'),
        robots: "noindex, nofollow",
    };
}

export default async function FinancePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ view?: string }> }) {
    const { locale } = await params;
    const resolvedSearch = await searchParams;
    const defaultTab = resolvedSearch.view || "overview";
    const t = await getTranslations({ locale, namespace: 'MegaMenu.Finance' });

    const orgId = await getActiveOrganizationId();
    if (!orgId) {
        redirect('/');
    }

    const supabase = await createClient();

    const [movementsData, settingsData, clientsData, capitalMovementsResult, capitalParticipantsResult] = await Promise.all([
        getFinancialMovements(),
        getOrganizationSettingsData(orgId),
        getClientsByOrganization(orgId),
        // Capital: movements from ledger view
        supabase
            .schema("finance").from("capital_ledger_view")
            .select(`id, organization_id, project_id, partner_id, movement_type, signed_amount, original_amount, currency_id, exchange_rate, movement_date, notes, reference, wallet_id, status, created_by, created_at`)
            .eq("organization_id", orgId)
            .order("movement_date", { ascending: false }),
        // Capital: participants with balances
        supabase
            .schema("finance").from("capital_participants_summary_view")
            .select(`partner_id, organization_id, contact_id, ownership_percentage, status, notes, created_at, total_contributed, total_withdrawn, total_adjusted, current_balance, contributions_count, withdrawals_count, last_movement_date`)
            .eq("organization_id", orgId),
    ]);

    const { movements, wallets, projects, error } = movementsData;
    const clients = clientsData.data || [];

    // ── Capital data mapping ────────────────────────────────────
    // Fetch currencies for code/symbol lookup
    const { data: allCurrencies } = await supabase
        .schema("finance").from("currencies")
        .select("id, code, symbol");
    const currencyMap = new Map((allCurrencies || []).map(c => [c.id, c]));

    // Fetch contact names for participants
    const capitalParticipantRows = capitalParticipantsResult.data || [];
    const capitalContactIds = capitalParticipantRows.map((p: any) => p.contact_id).filter(Boolean);
    let capitalContactMap = new Map<string, any>();
    if (capitalContactIds.length > 0) {
        const { data: capitalContacts } = await supabase
            .schema("contacts").from("contacts")
            .select("id, full_name, image_url")
            .in("id", capitalContactIds);
        capitalContactMap = new Map((capitalContacts || []).map(c => [c.id, c]));
    }

    const capitalMovements = (capitalMovementsResult.data || []).map((m: any) => {
        const cur = currencyMap.get(m.currency_id);
        return {
            id: m.id,
            type: m.movement_type,
            payment_date: m.movement_date,
            amount: m.original_amount,
            currency_id: m.currency_id,
            currency_code: cur?.code || "",
            currency_symbol: cur?.symbol || "$",
            exchange_rate: m.exchange_rate,
            wallet_id: m.wallet_id,
            participant_id: m.partner_id,
            notes: m.notes,
            reference: m.reference,
            status: m.status,
            description: m.notes || m.reference || "",
            project_id: m.project_id,
            created_by: m.created_by,
            created_at: m.created_at,
        };
    });

    const capitalParticipants = capitalParticipantRows.map((p: any) => {
        const contact = capitalContactMap.get(p.contact_id);
        return {
            id: p.partner_id,
            contact_id: p.contact_id,
            name: contact?.full_name || "Participante",
            avatar_url: contact?.image_url || null,
            ownership_percentage: p.ownership_percentage,
            status: p.status,
            notes: p.notes,
            total_contributed: p.total_contributed,
            total_withdrawn: p.total_withdrawn,
            total_adjusted: p.total_adjusted,
            current_balance: p.current_balance,
            contributions_count: p.contributions_count,
            withdrawals_count: p.withdrawals_count,
            last_movement_date: p.last_movement_date,
        };
    });

    const capitalWallets = (settingsData.contactWallets || []).map((w: any) => ({
        id: w.id,
        wallet_name: w.wallet_name || "",
    }));

    if (error || !movements) {
        return (
            <PageWrapper type="page" title={t('title')} icon={<DollarSign />}>
                <ContentLayout variant="wide">
                    <ErrorDisplay
                        title="Error al cargar contenidos"
                        message={typeof error === 'string' ? error : "Error desconocido"}
                        retryLabel="Recargar"
                    />
                </ContentLayout>
            </PageWrapper>
        );
    }

    // Build financialData object for client payment form
    const orgCurrencies = (settingsData.contactCurrencies || []).map((c: any) => ({
        id: c.currency_id || c.id,
        code: c.currency_code || c.code,
        symbol: c.currency_symbol || c.symbol,
        name: c.currency_name || c.name,
    }));

    const financialData = {
        wallets: wallets || [],
        currencies: orgCurrencies,
        defaultWalletId: wallets?.[0]?.id || null,
        defaultCurrencyId: orgCurrencies[0]?.id || null,
    };

    return (
        <Tabs defaultValue={defaultTab} syncUrl="view" className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title={t('title')}
                icon={<DollarSign />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                        <TabsTrigger value="overview" className={tabTriggerClass}>
                            {t('items.overview')}
                        </TabsTrigger>
                        <TabsTrigger value="payments" className={tabTriggerClass}>
                            Movimientos
                        </TabsTrigger>
                        <TabsTrigger value="capital" className={tabTriggerClass}>
                            Capital
                        </TabsTrigger>
                        <TabsTrigger value="settings" className={tabTriggerClass}>
                            Configuración
                        </TabsTrigger>
                    </TabsList>
                }
            >
                {/* Overview Tab */}
                <TabsContent value="overview" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                    <ContentLayout variant="wide">
                        <FinancesOverviewView
                            movements={movements}
                            wallets={wallets}
                        />
                    </ContentLayout>
                </TabsContent>

                {/* Payments/Movements Tab */}
                <TabsContent value="payments" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                    <ContentLayout variant="wide">
                        <FinancesMovementsView
                            movements={movements}
                            wallets={wallets}
                            projects={projects}
                            showProjectColumn={true}
                            organizationId={orgId}
                            currencies={orgCurrencies}
                            clients={clients}
                            financialData={financialData}
                        />
                    </ContentLayout>
                </TabsContent>

                {/* Capital Tab */}
                <TabsContent value="capital" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                    <ContentLayout variant="wide">
                        <FinancesCapitalView
                            movements={capitalMovements}
                            participants={capitalParticipants}
                            wallets={capitalWallets}
                            organizationId={orgId}
                        />
                    </ContentLayout>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                    <ContentLayout variant="settings">
                        <FinancesSettingsView
                            organizationId={orgId}
                            preferences={settingsData.preferences}
                            orgCurrencies={settingsData.contactCurrencies}
                            orgWallets={settingsData.contactWallets}
                            availableCurrencies={settingsData.availableCurrencies}
                            availableWallets={settingsData.availableWallets}
                            subscription={settingsData.subscription}
                        />
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
