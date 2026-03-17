/**
 * ProjectChip — Chip for project selection
 *
 * Renders project avatar + name as a chip. Popover shows searchable
 * project list with avatars. Self-populating from organization store.
 *
 * Behavior:
 * - Only shows projects with status "planning" or "active" by default
 * - If current value is a completed/inactive project, still shows it
 *   (allow existing, restrict new)
 * - "Sin proyecto (Global)" option when allowNone=true
 *
 * Usage:
 *   <ProjectChip
 *     value={projectId}
 *     onChange={setProjectId}
 *     allowNone
 *     noneLabel="Sin proyecto (Global)"
 *   />
 */

"use client";

import * as React from "react";
import { Building2, Check, Search, X } from "lucide-react";
import { ChipBase } from "../chip-base";
import { useFormData } from "@/stores/organization-store";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface ProjectChipProject {
    id: string;
    name: string;
    image_url?: string | null;
    color?: string | null;
    status?: string;
}

export interface ProjectChipProps {
    value: string | null;
    onChange: (value: string | null) => void;
    /** Override: pass custom projects list. Default: reads from store */
    projects?: ProjectChipProject[];
    /** Show "Sin proyecto" option (default: true) */
    allowNone?: boolean;
    /** Label for "none" option */
    noneLabel?: string;
    /** Label when no project selected */
    emptyLabel?: string;
    /** Only show projects with these statuses (default: ["planning", "active"]) */
    activeStatuses?: string[];
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

// ─── Helpers ─────────────────────────────────────────────

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// ─── Avatar ──────────────────────────────────────────────

function ProjectAvatar({
    project,
    size = "sm",
}: {
    project: ProjectChipProject;
    size?: "sm" | "md";
}) {
    const s = size === "sm" ? "h-4 w-4" : "h-5 w-5";
    const text = size === "sm" ? "text-[6px]" : "text-[8px]";

    if (project.image_url) {
        return (
            <img
                src={project.image_url}
                alt={project.name}
                className={cn(s, "rounded-full object-cover shrink-0")}
            />
        );
    }

    return (
        <div
            className={cn(
                s,
                "rounded-full shrink-0 flex items-center justify-center font-bold text-white",
                text
            )}
            style={{ backgroundColor: project.color || "#007AFF" }}
        >
            {getInitials(project.name)}
        </div>
    );
}

// ─── Popover Content ─────────────────────────────────────

function ProjectPopoverContent({
    projects,
    currentValue,
    onSelect,
    allowNone,
    noneLabel,
}: {
    projects: ProjectChipProject[];
    currentValue: string | null;
    onSelect: (value: string | null) => void;
    allowNone: boolean;
    noneLabel: string;
}) {
    return (
        <Command>
            <CommandInput placeholder="Buscar proyecto..." />
            <CommandList>
                <CommandEmpty>No se encontraron proyectos.</CommandEmpty>
                <CommandGroup>
                    {allowNone && (
                        <CommandItem
                            value="__none__"
                            onSelect={() => onSelect(null)}
                            className="gap-2"
                        >
                            <div className="h-5 w-5 rounded-full shrink-0 flex items-center justify-center bg-muted border border-border/40">
                                <X className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <span className="text-muted-foreground">{noneLabel}</span>
                            {!currentValue && (
                                <Check className="ml-auto h-3.5 w-3.5 text-primary" />
                            )}
                        </CommandItem>
                    )}
                    {projects.map((project) => (
                        <CommandItem
                            key={project.id}
                            value={project.name}
                            onSelect={() => onSelect(project.id)}
                            className="gap-2"
                        >
                            <ProjectAvatar project={project} size="md" />
                            <span className="truncate">{project.name}</span>
                            {currentValue === project.id && (
                                <Check className="ml-auto h-3.5 w-3.5 text-primary" />
                            )}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );
}

// ─── Component ───────────────────────────────────────────

export function ProjectChip({
    value,
    onChange,
    projects: projectsOverride,
    allowNone = true,
    noneLabel = "Sin proyecto",
    emptyLabel = "Proyecto",
    activeStatuses = ["planning", "active"],
    readOnly = false,
    disabled = false,
    className,
}: ProjectChipProps) {
    const [open, setOpen] = React.useState(false);

    // Self-populating from store
    const storeData = useFormData();
    const allProjects = (projectsOverride ?? storeData.projects ?? []) as ProjectChipProject[];

    // Filter to active statuses for selection
    const selectableProjects = React.useMemo(() => {
        return allProjects
            .filter((p) => {
                if (!p.status) return true; // If no status field, include
                return activeStatuses.includes(p.status);
            })
            .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    }, [allProjects, activeStatuses]);

    // Find current project (may be inactive — allow existing)
    const currentProject = value
        ? allProjects.find((p) => p.id === value)
        : null;

    // Ensure current project is in the list even if inactive
    const displayProjects = React.useMemo(() => {
        if (!currentProject) return selectableProjects;
        const exists = selectableProjects.some((p) => p.id === currentProject.id);
        if (exists) return selectableProjects;
        return [currentProject, ...selectableProjects];
    }, [selectableProjects, currentProject]);

    // Chip display
    const hasValue = !!currentProject;
    const label = currentProject ? currentProject.name : emptyLabel;
    const icon = currentProject
        ? <ProjectAvatar project={currentProject} size="sm" />
        : <Building2 className="h-3.5 w-3.5 text-muted-foreground" />;

    return (
        <ChipBase
            icon={icon}
            label={label}
            hasValue={hasValue}
            readOnly={readOnly}
            disabled={disabled}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={260}
            className={className}
        >
            <ProjectPopoverContent
                projects={displayProjects}
                currentValue={value}
                onSelect={(val) => {
                    onChange(val);
                    setOpen(false);
                }}
                allowNone={allowNone}
                noneLabel={noneLabel}
            />
        </ChipBase>
    );
}
