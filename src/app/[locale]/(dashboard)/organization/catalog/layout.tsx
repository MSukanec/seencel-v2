import { requireAuthContext } from "@/lib/auth";
import { PageWrapper } from "@/components/layout";
import { Wrench } from "lucide-react";

export default async function CatalogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuthContext();

    return (
        <PageWrapper
            type="page"
            title="Catálogo Técnico"
            icon={<Wrench />}
        >
            {children}
        </PageWrapper>
    );
}
