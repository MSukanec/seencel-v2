/**
 * Project Field Factory
 * Standard 19.13 - Reusable Project Selector
 * 
 * Provides a standardized project selector with:
 * - Consistent formatting
 * - Support for disabled state
 * - Empty state handling
 */

"use client";

import { FormGroup } from "@/components/ui/form-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FactoryLabel } from "./field-wrapper";

export interface Project {
    id: string;
    name: string;
}

export interface ProjectFieldProps {
    /** Current selected project ID */
    value: string;
    /** Callback when project changes */
    onChange: (value: string) => void;
    /** List of available projects */
    projects: Project[];
    /** Field label (default: "Proyecto") */
    label?: string;
    /** Is field required? (default: true) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
}

export function ProjectField({
    value,
    onChange,
    projects,
    label = "Proyecto",
    required = true,
    disabled = false,
    className,
    placeholder = "Seleccionar proyecto",
}: ProjectFieldProps) {
    return (
        <FormGroup label={<FactoryLabel label={label} />} required={required} className={className}>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {projects.length === 0 ? (
                        <SelectItem value="_empty" disabled>
                            No hay proyectos disponibles
                        </SelectItem>
                    ) : (
                        projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                                {project.name}
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
        </FormGroup>
    );
}
