"use client";

import { PageWrapper } from "@/components/layout";
import { ClipboardList, FolderTree } from "lucide-react";

const ROUTE_TABS = [
    { value: "tasks", label: "Tareas", href: "/organization/catalog/tasks" },
    { value: "divisions", label: "Rubros", href: "/organization/catalog/tasks/divisions" },
];

export default function TasksCatalogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PageWrapper title="Catálogo Técnico" icon={<ClipboardList />} routeTabs={ROUTE_TABS}>
            {children}
        </PageWrapper>
    );
}
