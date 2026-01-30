"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface StudentCourseTabsProps {
    courseSlug: string;
}

export function StudentCourseTabs({ courseSlug }: StudentCourseTabsProps) {
    const pathname = usePathname();
    const baseUrl = `/academy/my-courses/${courseSlug}`;

    const tabs = [
        {
            href: baseUrl,
            label: "Visión General",
            exactMatch: true
        },
        {
            href: `${baseUrl}/player`,
            label: "Reproductor",
            activeMatch: "/player"
        },
        {
            href: `${baseUrl}/content`,
            label: "Contenido",
            activeMatch: "/content"
        },
        {
            href: `${baseUrl}/notes`,
            label: "Apuntes",
            activeMatch: "/notes"
        },
        {
            href: `${baseUrl}/forum`,
            label: "Foro",
            activeMatch: "/forum"
        }
    ];

    return (
        <div className="h-full">
            <nav className="flex h-14 items-center gap-1 md:gap-4 overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => {
                    // For exact match (overview tab), check if pathname ends with the base URL
                    // For other tabs, check if pathname includes the activeMatch
                    const isActive = tab.exactMatch
                        ? pathname === baseUrl || pathname.endsWith(courseSlug)
                        : pathname.includes(tab.activeMatch!);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap h-full text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-b-2 gap-2 px-2 md:px-3",
                                isActive
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span>{tab.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

