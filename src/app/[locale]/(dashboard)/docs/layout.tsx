import { getDocsTree } from "@/features/docs/lib/get-docs-content";
import { DocsSidebar } from "@/features/docs/components/docs-sidebar";
import { getLocale } from "next-intl/server";

interface DocsLayoutProps {
    children: React.ReactNode;
}

export default async function DocsLayout({ children }: DocsLayoutProps) {
    const locale = await getLocale();
    const tree = await getDocsTree(locale);

    return (
        <div className="flex h-full">
            {/* Left sidebar - Feature navigation */}
            <aside className="w-64 border-r border-border bg-background p-4 overflow-y-auto hidden md:block">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">Documentación</h2>
                    <p className="text-sm text-muted-foreground">Guías y tutoriales</p>
                </div>
                <DocsSidebar tree={tree} />
            </aside>

            {/* Main content area */}
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
}
