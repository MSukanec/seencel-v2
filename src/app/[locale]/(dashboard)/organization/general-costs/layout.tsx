import { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { CreditCard } from "lucide-react";

export const metadata: Metadata = {
    title: "Gastos Generales | Seencel",
    robots: "noindex, nofollow",
};

export default async function GeneralCostsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Auth check — shared across all sub-pages
    await requireAuthContext();

    return (
        <PageWrapper
            type="page"
            title="Gastos Generales"
            icon={<CreditCard />}
        >
            <ContentLayout variant="wide">
                {children}
            </ContentLayout>
        </PageWrapper>
    );
}
