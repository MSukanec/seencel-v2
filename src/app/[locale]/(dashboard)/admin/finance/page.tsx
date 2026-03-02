import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, CreditCard, Landmark, PieChart, Ticket } from "lucide-react";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import {
    AdminFinanceSubscriptionsView,
    AdminFinancePaymentsView,
    AdminFinanceTransfersView,
    AdminFinancePlansView,
    AdminFinanceCouponsView,
} from "@/features/admin/finance/views";
import {
    getAdminPayments,
    getAdminBankTransfers,
    getAdminSubscriptions,
    getAdminPlans,
} from "@/features/admin/finance/queries";
import { getCoupons } from "@/features/admin/coupon-actions";

// ✅ METADATA OBLIGATORIA
export const metadata: Metadata = {
    title: "Finanzas | Seencel Admin",
    description: "Gestión de pagos, transferencias, suscripciones y cupones",
    robots: "noindex, nofollow",
};

export default async function AdminFinancePage() {
    try {
        const [payments, bankTransfers, subscriptions, plans, coupons] = await Promise.all([
            getAdminPayments(),
            getAdminBankTransfers(),
            getAdminSubscriptions(),
            getAdminPlans(),
            getCoupons(),
        ]);

        return (
            <Tabs defaultValue="payments" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Finanzas"
                    icon={<Wallet />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="payments">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pagos
                            </TabsTrigger>
                            <TabsTrigger value="transfers">
                                <Landmark className="h-4 w-4 mr-2" />
                                Transferencias
                            </TabsTrigger>
                            <TabsTrigger value="subscriptions">
                                <Wallet className="h-4 w-4 mr-2" />
                                Suscripciones
                            </TabsTrigger>
                            <TabsTrigger value="plans">
                                <PieChart className="h-4 w-4 mr-2" />
                                Planes
                            </TabsTrigger>
                            <TabsTrigger value="coupons">
                                <Ticket className="h-4 w-4 mr-2" />
                                Cupones
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    <ContentLayout variant="wide">
                        <TabsContent value="payments" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                            <AdminFinancePaymentsView payments={payments} />
                        </TabsContent>

                        <TabsContent value="transfers" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                            <AdminFinanceTransfersView bankTransfers={bankTransfers} />
                        </TabsContent>

                        <TabsContent value="subscriptions" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                            <AdminFinanceSubscriptionsView subscriptions={subscriptions} />
                        </TabsContent>

                        <TabsContent value="plans" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                            <AdminFinancePlansView plans={plans} />
                        </TabsContent>

                        <TabsContent value="coupons" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                            <AdminFinanceCouponsView coupons={coupons} />
                        </TabsContent>
                    </ContentLayout>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
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
