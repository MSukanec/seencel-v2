"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { DetailContentTabs } from "@/components/shared/detail-content-tabs";
import { useFeatureFlags } from "@/providers/feature-flags-provider";
import { Lock } from "lucide-react";

interface StudentCourseTabsProps {
    courseSlug: string;
}

/**
 * Route-based course tabs using real TabsList + TabsTrigger.
 * Wrapped in TabsPrimitive.Root with h-full so PageHeader's 
 * CSS selectors ([role=tablist], [role=tab]) work correctly.
 */
export function StudentCourseTabs({ courseSlug }: StudentCourseTabsProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { isAdmin } = useFeatureFlags();

    // Extract the segment after the course slug
    const slugIndex = pathname.lastIndexOf(courseSlug);
    const afterSlug = slugIndex >= 0
        ? pathname.substring(slugIndex + courseSlug.length).replace(/^\//, '').split('/')[0] || ''
        : '';

    // Map EN and ES segments to a stable tab id
    const segmentToTab: Record<string, string> = {
        '': 'overview',
        'player': 'player', 'reproductor': 'player',
        'content': 'content', 'contenido': 'content',
        'notes': 'notes', 'notas': 'notes',
        'forum': 'forum', 'foro': 'forum',
        'certificate': 'certificate', 'certificado': 'certificate',
    };

    const activeTab = segmentToTab[afterSlug] ?? 'overview';

    const handleTabChange = (value: string) => {
        const tabToHref: Record<string, string> = {
            overview: `/academy/my-courses/${courseSlug}`,
            player: `/academy/my-courses/${courseSlug}/player`,
            content: `/academy/my-courses/${courseSlug}/content`,
            notes: `/academy/my-courses/${courseSlug}/notes`,
            forum: `/academy/my-courses/${courseSlug}/forum`,
            certificate: `/academy/my-courses/${courseSlug}/certificate`,
        };
        const href = tabToHref[value];
        if (href) {
            router.push(href as any);
        }
    };

    // Wrapped in DetailContentTabs to portal to the center of the Header, same aesthetic as Projects
    return (
        <DetailContentTabs>
            <TabsPrimitive.Root value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger value="overview">Visión General</TabsTrigger>
                    <TabsTrigger value="player">Reproductor</TabsTrigger>
                    <TabsTrigger value="content">Contenido</TabsTrigger>
                    <TabsTrigger value="notes">Apuntes</TabsTrigger>
                    <TabsTrigger value="forum">Foro</TabsTrigger>
                    <TabsTrigger value="certificate" disabled={!isAdmin}>
                        Certificado
                        {!isAdmin && <Lock className="h-3 w-3 ml-1 opacity-50" />}
                    </TabsTrigger>
                </TabsList>
            </TabsPrimitive.Root>
        </DetailContentTabs>
    );
}

