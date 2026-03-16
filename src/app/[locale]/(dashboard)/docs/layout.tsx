import { getDocsTree } from "@/features/docs/lib/get-docs-content";
import { DocsSidebar } from "@/features/docs/components/docs-sidebar";
import { getLocale } from "next-intl/server";
import { BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Documentación | SEENCEL",
    description: "Guías y tutoriales de la plataforma Seencel",
    robots: "noindex, nofollow",
};

interface DocsLayoutProps {
    children: React.ReactNode;
}

export default async function DocsLayout({ children }: DocsLayoutProps) {
    const locale = await getLocale();
    const tree = await getDocsTree(locale);

    return (
        <div className="flex h-full overflow-hidden">
            {/* Left sidebar — Docs navigation */}
            <aside className="w-60 shrink-0 border-r border-border/50 bg-background overflow-y-auto hidden md:flex md:flex-col">
                {/* Header */}
                <div className="px-4 pt-5 pb-3">
                    <div className="flex items-center gap-2 mb-0.5">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-semibold text-foreground">Documentación</h2>
                    </div>
                    <p className="text-xs text-muted-foreground">Guías y tutoriales</p>
                </div>

                {/* Navigation */}
                <div className="flex-1 px-2 pb-4 overflow-y-auto">
                    <DocsSidebar tree={tree} />
                </div>
            </aside>

            {/* Main content area */}
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
}
