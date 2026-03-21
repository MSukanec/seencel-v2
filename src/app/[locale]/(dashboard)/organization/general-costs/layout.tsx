import { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { CreditCard } from "lucide-react";

export const metadata: Metadata = {
    title: "Gastos Generales | Seencel",
    robots: "noindex, nofollow",
};

const ROUTE_TABS = [
    { value: "overview", label: "Visión General", href: "/organization/general-costs" },
    { value: "payments", label: "Pagos", href: "/organization/general-costs/payments" },
    { value: "concepts", label: "Conceptos", href: "/organization/general-costs/concepts" },
];

export default async function GeneralCostsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuthContext();

    return (
        <PageWrapper
            title="Gastos Generales"
            icon={<CreditCard />}
            routeTabs={ROUTE_TABS}
        >
            <ContentLayout variant="wide">
                {children}
            </ContentLayout>
        </PageWrapper>
    );
}
