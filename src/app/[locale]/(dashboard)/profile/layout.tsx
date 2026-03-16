import { requireAuthContext } from "@/lib/auth";
import { PageWrapper } from "@/components/layout";
import { Settings } from "lucide-react";

export default async function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuthContext();

    return (
        <PageWrapper title="Configuración" icon={<Settings />}>
            {children}
        </PageWrapper>
    );
}
