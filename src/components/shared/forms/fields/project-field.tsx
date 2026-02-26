/**
 * Project Field Factory (Smart)
 * Standard 19.13 - Unified Project Selector
 *
 * - Self-populating: reads projects from useFormData() store
 * - Avatar: project image or color-based initials fallback
 * - Always shows active projects (filtered at query level)
 * - Override: pass `projects` prop to use custom list
 * - Tooltip: explains the field is optional with link to /organization/projects
 */

"use client";

import { useMemo } from "react";
import { FormGroup } from "@/components/ui/form-group";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { FactoryLabel } from "./field-wrapper";
import { Link } from "@/i18n/routing";
import { useFormData } from "@/stores/organization-store";

export interface Project {
    id: string;
    name: string;
    image_url?: string | null;
    color?: string | null;
}

export interface ProjectFieldProps {
    value: string;
    onChange: (value: string) => void;
    /** Override: pass custom projects list. Default: reads from store */
    projects?: Project[];
    label?: string;
    tooltip?: React.ReactNode;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    allowNone?: boolean;
    noneLabel?: string;
}

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
function ProjectOptionContent({ project }: { project: Project }) {
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

/**
 * Tooltip por defecto para el campo Proyecto.
 */
const DEFAULT_PROJECT_TOOLTIP = (
    <span className="flex flex-col gap-1.5 text-xs leading-relaxed">
        <span>
            Vinculá esto a uno de tus{" "}
            <Link href="/organization/projects" className="underline">
                Proyectos
            </Link>{" "}
            activos. Solo se muestran proyectos con estado <strong>Activo</strong>.
        </span>
        <span className="text-muted-foreground">
            Este campo es <strong>opcional</strong>. Puede existir sin proyecto asignado.
        </span>
    </span>
);

export function ProjectField({
    value,
    onChange,
    projects: projectsOverride,
    label = "Proyecto",
    tooltip = DEFAULT_PROJECT_TOOLTIP,
    required = false,
    disabled = false,
    className,
    placeholder = "Seleccionar proyecto...",
    searchPlaceholder = "Buscar proyecto...",
    emptyMessage = "No hay proyectos activos.",
    allowNone = true,
    noneLabel = "Sin proyecto",
}: ProjectFieldProps) {
    // Smart: read from store by default, allow override
    const storeData = useFormData();
    const projects = projectsOverride ?? (storeData.projects as Project[]);

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
        <FormGroup
            label={<FactoryLabel label={label} />}
            required={required}
            tooltip={tooltip}
            className={className}
        >
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
