"use client";

import * as React from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayoutData } from "@/hooks/use-layout-data";
import { useActiveProjectId } from "@/stores/layout-store";
import { usePathname as useNextPathname } from "next/navigation";
import { ProjectSelectorPopover, renderProjectAvatar } from "./popovers/project-selector-popover";
import type { ProjectLike } from "./popovers/project-selector-popover";

// ============================================================================
// SIDEBAR PROJECT SELECTOR — Thin wrapper
// ============================================================================
// Composes: visual trigger + ProjectSelectorPopover from popovers/
// ============================================================================

interface SidebarProjectSelectorProps {
    isExpanded?: boolean;
}

export function SidebarProjectSelector({ isExpanded = true }: SidebarProjectSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const pathname = useNextPathname();
    const { projects } = useLayoutData();
    const activeProjectId = useActiveProjectId();

    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/)/, '');
    const isOrgRoute = pathWithoutLocale.startsWith('/organization') || pathWithoutLocale.startsWith('/organizacion');

    if (!isOrgRoute) return null;

    const activeProjects = (projects || []).filter((p: ProjectLike) => !p.status || p.status === 'active' || p.status === 'planning');
    const selectedProject = activeProjectId
        ? activeProjects.find((p: ProjectLike) => p.id === activeProjectId) || null
        : null;

    // Collapsed sidebar: just show icon
    if (!isExpanded) {
        return (
            <div className="flex items-center justify-center w-full">
                {selectedProject ? (
                    renderProjectAvatar(selectedProject)
                ) : (
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                )}
            </div>
        );
    }

    const sharedCardClass = cn(
        "bg-white/[0.03] border border-white/[0.08]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)]",
        "hover:bg-white/[0.05] hover:border-white/[0.11]",
        "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_3px_8px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.25)]",
        "text-sidebar-foreground",
        open && "bg-white/[0.05] border-white/[0.11]"
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2.5 rounded-xl transition-all cursor-pointer w-full px-2 py-1.5",
                        sharedCardClass
                    )}
                >
                    {selectedProject ? (
                        <>
                            {renderProjectAvatar(selectedProject, 'md')}
                            <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className="text-sm font-semibold truncate w-full text-left leading-tight">
                                    {selectedProject.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground leading-tight truncate w-full text-left">
                                    {selectedProject.status === 'active' ? 'Activo' : selectedProject.status === 'planning' ? 'Planificación' : selectedProject.status === 'completed' ? 'Completado' : 'Proyecto'}
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-primary/10">
                                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className="text-sm font-semibold truncate w-full text-left leading-tight text-muted-foreground">
                                    General
                                </span>
                                <span className="text-[11px] text-muted-foreground/60 leading-tight">
                                    Sin proyecto
                                </span>
                            </div>
                        </>
                    )}
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                </button>
            </PopoverTrigger>

            <PopoverContent
                side="right"
                align="start"
                sideOffset={12}
                className="w-[220px] p-0"
            >
                <ProjectSelectorPopover onClose={() => setOpen(false)} />
            </PopoverContent>
        </Popover>
    );
}
