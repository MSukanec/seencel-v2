import { requireAuthContext } from "@/lib/auth";
import { PageWrapper } from "@/components/layout";
import { BookUser, Settings } from "lucide-react";

export default async function ContactsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Auth check — shared across all sub-pages
    await requireAuthContext();

    return (
        <PageWrapper
            title="Contactos"
            icon={<BookUser />}
            routeTabs={[
                { value: "overview", label: "Visión General", href: "/organization/contacts" },
                { value: "settings", label: "Configuración", href: "/organization/contacts/settings", icon: <Settings className="h-4 w-4 mr-2" /> }
            ]}
        >
            {children}
        </PageWrapper>
    );
}

