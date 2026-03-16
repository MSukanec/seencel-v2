import { requireAuthContext } from "@/lib/auth";
import { PageWrapper } from "@/components/layout";

export default async function ContactsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Auth check — shared across all sub-pages
    await requireAuthContext();

    return (
        <PageWrapper title="Contactos">
            {children}
        </PageWrapper>
    );
}

