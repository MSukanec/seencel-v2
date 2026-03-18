import { getTranslations } from "next-intl/server";
import { PageWrapper } from "@/components/layout";
import { GraduationCap } from "lucide-react";

export default async function AdminAcademyLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const t = await getTranslations({ locale: (await params).locale, namespace: 'Admin.academy' });

    return (
        <PageWrapper
            title="Academia"
            icon={<GraduationCap className="h-4 w-4" />}
        >
            {children}
        </PageWrapper>
    );
}
