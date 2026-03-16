import { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";

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

    return <>{children}</>;
}

