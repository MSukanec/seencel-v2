import { Metadata } from "next";
import { setRequestLocale } from 'next-intl/server';
import { requireAuthContext } from "@/lib/auth";
import { PageWrapper } from "@/components/layout";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
    title: "Bitácora de Obra | Seencel",
    robots: "noindex, nofollow",
};

const ROUTE_TABS = [
    { value: "entries", label: "Entradas", href: "/organization/sitelog" },
    { value: "settings", label: "Ajustes", href: "/organization/sitelog/settings" },
];

interface Props {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}

export default async function SitelogLayout({ children, params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);

    await requireAuthContext();

    return (
        <PageWrapper
            title="Bitácora de Obra"
            icon={<FileText />}
            routeTabs={ROUTE_TABS}
        >
            {children}
        </PageWrapper>
    );
}
