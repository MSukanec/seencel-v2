import { requireAuthContext } from "@/lib/auth";
import { PageWrapper } from "@/components/layout";
import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function PlannerLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    // Auth check — shared across all sub-pages
    await requireAuthContext();

    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Planner' });

    return (
        <PageWrapper
            title={t('title')}
            icon={<CalendarDays />}
        >
            {children}
        </PageWrapper>
    );
}
