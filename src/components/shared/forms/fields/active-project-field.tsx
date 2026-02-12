/**
 * Active Project Field Factory
 * Standard 19.13 - Reusable Active Project Selector
 * 
 * Provides a standardized active project selector with:
 * - Combobox with search functionality
 * - Project image avatar or color-based fallback
 * - Designed to show ONLY active projects (filtered by caller)
 * - Reusable across forms (swap modal, project assignment, etc.)
 */

"use client";

import { FormGroup } from "@/components/ui/form-group";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { FactoryLabel } from "./field-wrapper";
import { useMemo } from "react";

export interface ActiveProject {
    id: string;
    name: string;
    color?: string | null;
    image_url?: string | null;
}

export interface ActiveProjectFieldProps {
    /** Current selected project ID */
    value: string;
    /** Callback when project changes */
    onChange: (value: string) => void;
    /** List of active projects to display */
    projects: ActiveProject[];
    /** Field label (default: "Proyecto activo") */
    label?: string;
    /** Tooltip help content */
    tooltip?: React.ReactNode;
    /** Is field required? (default: true) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Search placeholder */
    searchPlaceholder?: string;
    /** Empty state message */
    emptyMessage?: string;
    /** Allow selecting "none" option */
    allowNone?: boolean;
    /** "None" option label */
    noneLabel?: string;
}

/**
 * Get initials from a project name for avatar fallback
 */
function getProjectInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

/**
 * Renders project option with color indicator or image avatar
 */
function ProjectOptionContent({ project }: { project: ActiveProject }) {
    return (
        <div className="flex items-center gap-2">
            {project.image_url ? (
                <img
                    src={project.image_url}
                    alt={project.name}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                />
            ) : (
                <div
                    className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ backgroundColor: project.color || "#007AFF" }}
                >
                    {getProjectInitials(project.name)}
                </div>
            )}
            <span>{project.name}</span>
        </div>
    );
}

export function ActiveProjectField({
    value,
    onChange,
    projects,
    label = "Proyecto",
    tooltip,
    required = true,
    disabled = false,
    className,
    placeholder = "Seleccioná un proyecto...",
    searchPlaceholder = "Buscar proyecto...",
    emptyMessage = "No hay proyectos activos.",
    allowNone = false,
    noneLabel = "Sin proyecto",
}: ActiveProjectFieldProps) {

    // Transform projects to combobox options with custom rendering
    const options: ComboboxOption[] = useMemo(() => {
        const sortedProjects = [...projects].sort((a, b) =>
            a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
        );

        const projectOptions: ComboboxOption[] = sortedProjects.map((project) => ({
            value: project.id,
            label: project.name,
            content: <ProjectOptionContent project={project} />,
            selectedContent: <ProjectOptionContent project={project} />,
        }));

        if (allowNone) {
            return [
                { value: "none", label: noneLabel },
                ...projectOptions,
            ];
        }

        return projectOptions;
    }, [projects, allowNone, noneLabel]);

    return (
        <FormGroup label={<FactoryLabel label={label} />} required={required} tooltip={tooltip} className={className}>
            <Combobox
                value={value || (allowNone ? "none" : "")}
                onValueChange={(val) => onChange(val === "none" ? "" : val)}
                options={options}
                placeholder={placeholder}
                searchPlaceholder={searchPlaceholder}
                emptyMessage={emptyMessage}
                disabled={disabled}
                modal={true}
            />
        </FormGroup>
    );
}
