"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, Image, BookOpen, MessageSquare, Star } from "lucide-react";

interface CourseTabsProps {
    courseId: string;
}

export function CourseTabs({ courseId }: CourseTabsProps) {
    const pathname = usePathname();
    const baseUrl = `/admin/courses/${courseId}`;

    const tabs = [
        {
            href: `${baseUrl}/general`,
            label: "General",
            icon: Settings,
            activeMatch: "/general"
        },
        {
            href: `${baseUrl}/marketing`,
            label: "Marketing",
            icon: Image,
            activeMatch: "/marketing"
        },
        {
            href: `${baseUrl}/content`,
            label: "Contenido",
            icon: BookOpen,
            activeMatch: "/content"
        },
        {
            href: `${baseUrl}/forum`,
            label: "Foro",
            icon: MessageSquare,
            activeMatch: "/forum"
        },
        {
            href: `${baseUrl}/testimonials`,
            label: "Testimonios",
            icon: Star,
            activeMatch: "/testimonials"
        }
    ];

    return (
        <div className="border-b">
            <nav className="flex h-12 items-center gap-4 px-4 overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => {
                    const isActive = pathname.includes(tab.activeMatch);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-b-2 gap-2 px-3",
                                isActive
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
