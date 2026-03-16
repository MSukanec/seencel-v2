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
    Building2,
    ChevronDown,
    FileText,
    ClipboardList,
    Users,
    HardHat,
    Calendar,
    FolderOpen,
    FolderTree,
    Receipt,
    Hammer,
    Briefcase,
    BarChart3,
    Wrench,
    type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type { DocTreeItem } from "../types";

// ─── Icon Registry ──────────────────────────────────────────
// Maps icon strings from _meta.json to Lucide components.
// If an icon is missing, it falls back to FileText gracefully.

const ICON_MAP: Record<string, LucideIcon> = {
    "rocket": Rocket,
    "package": Package,
    "dollar-sign": DollarSign,
    "building": Building,
    "building-2": Building2,
    "clipboard-list": ClipboardList,
    "users": Users,
    "hard-hat": HardHat,
    "calendar": Calendar,
    "folder-open": FolderOpen,
    "folder-tree": FolderTree,
    "receipt": Receipt,
    "file-text": FileText,
    "hammer": Hammer,
    "briefcase": Briefcase,
    "bar-chart-3": BarChart3,
    "wrench": Wrench,
};

/** Safely resolve an icon string to a Lucide component. Never returns undefined. */
function resolveIcon(iconName?: string): LucideIcon {
    if (!iconName) return FileText;
    return ICON_MAP[iconName] || FileText;
}

// ─── Types ──────────────────────────────────────────────────

interface DocsSidebarProps {
    tree: DocTreeItem[];
}

interface SidebarSectionProps {
    section: DocTreeItem;
    currentPath: string;
    locale: string;
}

// ─── Component ──────────────────────────────────────────────

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

function SidebarSection({ section, currentPath, locale }: SidebarSectionProps) {
    const isActive = currentPath.includes(`/docs/${section.slug}`);
    const [isOpen, setIsOpen] = useState(isActive);
    const Icon = resolveIcon(section.icon);

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
