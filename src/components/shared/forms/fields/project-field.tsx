/**
 * Project Field Factory
 * Standard 19.13 - Reusable Project Selector
 *
 * - Muestra avatar: imagen del proyecto si tiene, fallback con iniciales
 * - Por defecto muestra "Proyectos Activos" (filtro se aplica en la query del server)
 * - Tooltip: explica que el campo es opcional y links a /organization/projects
 */

"use client";

import { useMemo } from "react";
import { FormGroup } from "@/components/ui/form-group";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { FactoryLabel } from "./field-wrapper";
import { Link } from "@/i18n/routing";

export interface Project {
    id: string;
    name: string;
    image_url?: string | null;
    color?: string | null;
    custom_color_hex?: string | null;
}

export interface ProjectFieldProps {
    value: string;
    onChange: (value: string) => void;
    projects: Project[];
    label?: string;
    tooltip?: React.ReactNode;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
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
 * Tooltip por defecto para el campo Proyecto.
 * Explica que es opcional y que puede usarse antes o independientemente de un proyecto.
 */
const DEFAULT_PROJECT_TOOLTIP = (
    <span className="flex flex-col gap-1.5 text-xs leading-relaxed">
        <span>
            Vinculá este presupuesto a uno de tus{" "}
            <Link href="/organization/projects" className="underline">
                Proyectos
            </Link>{" "}
            activos. Solo se muestran proyectos con estado <strong>Activo</strong>.
        </span>
        <span className="text-muted-foreground">
            Este campo es <strong>opcional</strong>. Un presupuesto puede existir sin proyecto
            — por ejemplo cuando todavía no ganaste la obra o estás cotizando de forma independiente.
        </span>
    </span>
);

export function ProjectField({
    value,
    onChange,
    projects,
    label = "Proyecto",
    tooltip = DEFAULT_PROJECT_TOOLTIP,
    required = false,
    disabled = false,
    className,
    placeholder = "Proyectos Activos",
    allowNone = true,
    noneLabel = "Sin proyecto",
}: ProjectFieldProps) {

    const options: ComboboxOption[] = useMemo(() => {
        const projectOptions: ComboboxOption[] = projects
            .filter((p) => p.id !== "none")
            .map((project) => ({
                value: project.id,
                label: project.name,
                image: project.image_url || undefined,
                fallback: getProjectInitials(project.name),
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
                value={value || "none"}
                onValueChange={(val) => onChange(val)}
                options={options}
                placeholder={placeholder}
                searchPlaceholder="Buscar proyecto..."
                emptyMessage="No se encontraron proyectos activos."
                disabled={disabled}
                modal={true}
            />
        </FormGroup>
    );
}
