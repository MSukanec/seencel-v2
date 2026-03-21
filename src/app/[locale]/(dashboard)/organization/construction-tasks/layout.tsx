import { requireAuthContext } from "@/lib/auth";
import { PageWrapper } from "@/components/layout";
import { ClipboardList } from "lucide-react";

export default async function ConstructionTasksLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuthContext();

    return (
        <PageWrapper
            title="Tareas de Construcción"
            icon={<ClipboardList />}
        >
            {children}
        </PageWrapper>
    );
}
