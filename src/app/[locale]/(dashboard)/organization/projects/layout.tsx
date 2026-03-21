import { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";

import { PageWrapper } from "@/components/layout";
import { Building, Settings } from "lucide-react";

export const metadata: Metadata = {
    title: "Proyectos | Seencel",
    robots: "noindex, nofollow",
};

export default async function ProjectsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Auth check — shared across all sub-pages
    await requireAuthContext();

    return (
        <PageWrapper 
            title="Proyectos" 
            icon={<Building />}
            routeTabs={[
                { value: "overview", label: "Visión General", href: "/organization/projects" },
                { value: "location", label: "Mapa", href: "/organization/projects/location" },
                { value: "settings", label: "Configuración", href: "/organization/projects/settings", icon: <Settings className="h-4 w-4 mr-2" /> }
            ]}
        >
            {children}
        </PageWrapper>
    );
}

