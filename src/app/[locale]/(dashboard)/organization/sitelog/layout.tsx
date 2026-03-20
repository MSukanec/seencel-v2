import { setRequestLocale } from 'next-intl/server';
import { requireAuthContext } from "@/lib/auth";
import { PageWrapper } from "@/components/layout";
import { FileText } from "lucide-react";

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
        >
            {children}
        </PageWrapper>
    );
}
