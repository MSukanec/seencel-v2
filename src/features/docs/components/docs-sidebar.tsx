"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "@/i18n/routing";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
    Rocket,
    Package,
    DollarSign,
    Building,
    ChevronDown,
    FileText
} from "lucide-react";
import { useState } from "react";
import type { DocTreeItem } from "../types";

interface DocsSidebarProps {
    tree: DocTreeItem[];
}

const iconMap: Record<string, React.ElementType> = {
    rocket: Rocket,
    package: Package,
    "dollar-sign": DollarSign,
    building: Building,
};

export function DocsSidebar({ tree }: DocsSidebarProps) {
    const pathname = usePathname();
    const locale = useLocale();

    return (
        <nav className="space-y-1">
            {tree.map((section) => (
                <SidebarSection
                    key={section.slug}
                    section={section}
                    currentPath={pathname}
                    locale={locale}
                />
            ))}
        </nav>
    );
}

interface SidebarSectionProps {
    section: DocTreeItem;
    currentPath: string;
    locale: string;
}

function SidebarSection({ section, currentPath, locale }: SidebarSectionProps) {
    const isActive = currentPath.includes(`/docs/${section.slug}`);
    const [isOpen, setIsOpen] = useState(isActive);
    const Icon = section.icon ? iconMap[section.icon] : FileText;

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
            >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{section.title}</span>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 transition-transform",
                        isOpen ? "rotate-0" : "-rotate-90"
                    )}
                />
            </button>

            {isOpen && section.children && section.children.length > 0 && (
                <div className="ml-6 mt-1 space-y-1 border-l border-border pl-2">
                    {section.children.map((child) => (
                        <Link
                            key={child.slug}
                            href={`/${locale}/docs/${child.slug}`}
                            className={cn(
                                "block px-3 py-1.5 text-sm rounded-md transition-colors",
                                currentPath === `/docs/${child.slug}` || currentPath.endsWith(`/docs/${child.slug}`)
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {child.title}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
