import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageWrapper } from "@/components/layout";
import { Settings } from "lucide-react";

export default async function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthUser();
    if (!user) redirect('/login');

    return (
        <PageWrapper title="Configuración" icon={<Settings />}>
            {children}
        </PageWrapper>
    );
}
