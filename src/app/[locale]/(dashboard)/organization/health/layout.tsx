import { HeartPulse } from "lucide-react";
import { PageWrapper } from "@/components/layout";
import { requireAuthContext } from "@/lib/auth";

export default async function HealthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuthContext();

    return (
        <PageWrapper title="Salud" icon={<HeartPulse />}>
            {children}
        </PageWrapper>
    );
}
