"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";
import type { DocHeading } from "../types";

interface DocsTOCProps {
    headings: DocHeading[];
}

interface TOCItemProps {
    text: string;
    id: string;
    level: number;
    isActive: boolean;
    onClick: () => void;
}

function TOCItem({ text, id, level, isActive, onClick }: TOCItemProps) {
    const isChild = level > 2;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onClick();

        // Find the element and scroll to it
        const element = document.getElementById(id);
        if (element) {
            // Use scrollIntoView - the element is inside the scrollable container
            // scroll-mt-20 class on headings handles the offset
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Update URL hash
            window.history.pushState(null, '', `#${id}`);
        }
    };

    return (
        <a
            href={`#${id}`}
            onClick={handleClick}
            className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted/50 text-foreground",
                isChild && "pl-6"
            )}
        >
            {isChild && (
                <span className="shrink-0 text-muted-foreground/70 font-mono text-xs">
                    └
                </span>
            )}

            <span className="flex-1 truncate">
                {text}
            </span>
        </a>
    );
}

export function DocsTOC({ headings }: DocsTOCProps) {
    const [activeId, setActiveId] = useState<string>("");

    // Observe headings to detect which section is currently visible
    useEffect(() => {
        if (headings.length === 0) return;

        // Find the first heading to get the scroll container
        const firstHeading = document.getElementById(headings[0].id);
        const scrollContainer = firstHeading?.closest('.overflow-y-auto') as HTMLElement | null;

        const observer = new IntersectionObserver(
            (entries) => {
                // Find the first visible heading
                const visibleEntry = entries.find(entry => entry.isIntersecting);
                if (visibleEntry) {
                    setActiveId(visibleEntry.target.id);
                }
            },
            {
                root: scrollContainer, // Use scroll container as root
                rootMargin: '-80px 0px -60% 0px', // Trigger when heading is near top
                threshold: 0
            }
        );

        // Observe all headings
        headings.forEach((heading) => {
            const element = document.getElementById(heading.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [headings]);

    // Handle scroll to top
    const handleScrollToTop = () => {
        const scrollContainer = document.querySelector('.overflow-y-auto') as HTMLElement;
        if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setActiveId("");
    };

    if (headings.length === 0) {
        return null;
    }

    return (
        <div className="p-2 space-y-0.5 group/sidebar" data-sidebar-content>
            {/* All sections - title */}
            <button
                onClick={handleScrollToTop}
                className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                    activeId === ""
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted/50 text-foreground"
                )}
            >
                <Layers className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">Inicio</span>
            </button>

            {/* Divider */}
            <div className="border-t my-2" />

            {/* TOC items */}
            <div className="space-y-0.5">
                {headings.map((heading) => (
                    <TOCItem
                        key={heading.id}
                        text={heading.text}
                        id={heading.id}
                        level={heading.level}
                        isActive={activeId === heading.id}
                        onClick={() => setActiveId(heading.id)}
                    />
                ))}
            </div>
        </div>
    );
}
