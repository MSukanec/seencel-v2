import { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";

import { PageWrapper } from "@/components/layout";
import { Building } from "lucide-react";

export const metadata: Metadata = {
    title: "Proyectos | Seencel",
    robots: "noindex, nofollow",
};

export default async function ProjectsListingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuthContext();

    return (
        <PageWrapper 
            title="Proyectos" 
            icon={<Building />}
            routeTabs={[
                { value: "overview", label: "Visión General", href: "/organization/projects" },
                { value: "location", label: "Mapa", href: "/organization/projects/location" },
                { value: "settings", label: "Ajustes", href: "/organization/projects/settings" }
            ]}
        >
            {children}
        </PageWrapper>
    );
}
