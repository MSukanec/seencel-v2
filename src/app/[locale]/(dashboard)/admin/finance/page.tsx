import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, FileText, PieChart, Ticket, CreditCard } from "lucide-react";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import {
    AdminFinanceSubscriptionsView,
    AdminFinanceInvoicesView,
    AdminFinancePaymentsView,
    AdminFinancePlansView,
    AdminFinanceCouponsView,
} from "@/features/admin/finance/views";
import { getAdminPayments, getAdminBankTransfers } from "@/features/admin/finance/queries";
import { getCoupons } from "@/features/admin/coupon-actions";

// ✅ METADATA OBLIGATORIA
export const metadata: Metadata = {
    title: "Finanzas | Seencel Admin",
    description: "Gestión de pagos, suscripciones, facturas y cupones",
    robots: "noindex, nofollow",
};

export default async function AdminFinancePage() {
    // ✅ ERROR BOUNDARY MANUAL
    try {
        // Fetch data in parallel
        const [payments, bankTransfers, coupons] = await Promise.all([
            getAdminPayments(),
            getAdminBankTransfers(),
            getCoupons(),
        ]);

        return (
            <Tabs defaultValue="payments" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Finanzas"
                    icon={<Wallet />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-6 flex items-start justify-start">
                            <TabsTrigger
                                value="payments"
                                className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    <span>Pagos</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="subscriptions"
                                className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    <span>Suscripciones</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="invoices"
                                className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span>Facturación</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="plans"
                                className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <PieChart className="h-4 w-4" />
                                    <span>Planes</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="coupons"
                                className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <Ticket className="h-4 w-4" />
                                    <span>Cupones</span>
                                </div>
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    <TabsContent value="payments" className="m-0 h-full focus-visible:outline-none">
                        <ContentLayout variant="wide">
                            <AdminFinancePaymentsView payments={payments} bankTransfers={bankTransfers} />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="subscriptions" className="m-0 h-full focus-visible:outline-none">
                        <ContentLayout variant="wide">
                            <AdminFinanceSubscriptionsView />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="invoices" className="m-0 h-full focus-visible:outline-none">
                        <ContentLayout variant="wide">
                            <AdminFinanceInvoicesView />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="plans" className="m-0 h-full focus-visible:outline-none">
                        <ContentLayout variant="wide">
                            <AdminFinancePlansView />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="coupons" className="m-0 h-full focus-visible:outline-none">
                        <ContentLayout variant="wide">
                            <AdminFinanceCouponsView coupons={coupons} />
                        </ContentLayout>
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        // ✅ MANEJO DE ERRORES AMIGABLE
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar finanzas"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Recargar"
                />
            </div>
        );
    }
}
