import { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { PageWrapper } from "@/components/layout";
import { ClipboardList } from "lucide-react";

export const metadata: Metadata = {
    title: "Tareas de Construcción | Seencel",
    robots: "noindex, nofollow",
};

const ROUTE_TABS = [
    { value: "tasks", label: "Tareas", href: "/organization/construction-tasks" },
    { value: "catalog", label: "Catálogo", href: "/organization/construction-tasks/catalog" },
    { value: "settings", label: "Ajustes", href: "/organization/construction-tasks/settings" },
];

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
            routeTabs={ROUTE_TABS}
        >
            {children}
        </PageWrapper>
    );
}
