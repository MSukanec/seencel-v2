/**
 * Assigned To Field Factory
 * Standard 19.15 - Reusable Member Assignment Selector
 * 
 * Provides a standardized member assignment selector with:
 * - Avatar + full name display
 * - Feature Guard for Teams plan (can_invite_members)
 * - Consistent formatting across all forms
 * - "Sin asignar" default option
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
import { FeatureLockBadge } from "@/components/ui/feature-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface AssignableMember {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
}

export interface AssignedToFieldProps {
    /** Current assigned member ID (or null/undefined) */
    value: string | null | undefined;
    /** Callback when assignment changes */
    onChange: (value: string | null) => void;
    /** List of organization members */
    members: AssignableMember[];
    /** Field label (default: "Asignado a") */
    label?: string;
    /** Is field required? (default: false) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Whether the Teams feature is enabled (can_invite_members) */
    isTeamsEnabled?: boolean;
}

export function AssignedToField({
    value,
    onChange,
    members,
    label = "Asignado a",
    required = false,
    disabled = false,
    className,
    placeholder = "Sin asignar",
    isTeamsEnabled = true,
}: AssignedToFieldProps) {
    const handleChange = (val: string) => {
        onChange(val === "none" ? null : val);
    };

    const selectContent = (
        <div className="relative">
            {/* Badge flotante arriba-derecha del select */}
            {!isTeamsEnabled && (
                <div className="absolute -top-2 right-0 z-10">
                    <FeatureLockBadge
                        featureName="Asignación de miembros"
                        requiredPlan="TEAMS"
                        customMessage="Asignar tareas a miembros del equipo requiere el plan Teams."
                    />
                </div>
            )}
            <Select
                value={value || "none"}
                onValueChange={handleChange}
                disabled={disabled || !isTeamsEnabled}
            >
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">{placeholder}</SelectItem>
                    {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={member.avatar_url || ""} />
                                    <AvatarFallback className="text-[10px]">
                                        {member.full_name?.[0] || "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <span>{member.full_name || "Usuario"}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <FormGroup label={<FactoryLabel label={label} />} required={required} className={className}>
            {selectContent}
        </FormGroup>
    );
}
