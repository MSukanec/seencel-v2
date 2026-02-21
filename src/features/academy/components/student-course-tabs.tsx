"use client";

import { usePathname, useRouter } from "next/navigation";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as TabsPrimitive from "@radix-ui/react-tabs";

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
    };

    const activeTab = segmentToTab[afterSlug] ?? 'overview';

    // Base path up to (and including) the slug
    const basePath = slugIndex >= 0
        ? pathname.substring(0, slugIndex + courseSlug.length)
        : pathname;

    // Detect locale for correct localized segments
    const locale = pathname.split('/')[1];
    const isSpanish = locale === 'es';

    const tabSegments: Record<string, string> = {
        overview: '',
        player: isSpanish ? '/reproductor' : '/player',
        content: isSpanish ? '/contenido' : '/content',
        notes: isSpanish ? '/notas' : '/notes',
        forum: isSpanish ? '/foro' : '/forum',
    };

    const handleTabChange = (value: string) => {
        const segment = tabSegments[value] ?? '';
        router.push(basePath + segment);
    };

    // TabsPrimitive.Root must have h-full so the tabs fill the PageHeader height,
    // allowing the top-line + gradient pseudo-elements to render correctly.
    return (
        <TabsPrimitive.Root value={activeTab} onValueChange={handleTabChange} className="h-full">
            <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                <TabsTrigger value="overview">Visión General</TabsTrigger>
                <TabsTrigger value="player">Reproductor</TabsTrigger>
                <TabsTrigger value="content">Contenido</TabsTrigger>
                <TabsTrigger value="notes">Apuntes</TabsTrigger>
                <TabsTrigger value="forum">Foro</TabsTrigger>
            </TabsList>
        </TabsPrimitive.Root>
    );
}
