"use client";

import { memo } from "react";
import { ListItem } from "../list-item-base";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarStack } from "@/components/ui/avatar-stack";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Building, Trash2, Building2, Users, Sparkles, Check, Zap } from "lucide-react";
import { getStorageUrl } from "@/lib/storage-utils";

// ============================================================================
// Types
// ============================================================================

export interface OrganizationListItemData {
    id: string;
    name: string;
    logo_url?: string | null;
    plans?: {
        id: string;
        name: string;
        slug: string;
    } | null;
    members?: {
        name: string;
        image?: string | null;
        email?: string;
    }[];
    owner_id?: string | null;
}

export interface OrganizationListItemProps {
    /** Organization data */
    organization: OrganizationListItemData;
    /** Whether this org is the currently active one */
    isActive?: boolean;
    /** Whether the current user is the owner of this org */
    isOwner?: boolean;
    /** Label for the switch button */
    switchLabel?: string;
    /** Label for the active badge */
    activeLabel?: string;
    /** Callback when switch is clicked */
    onSwitch?: (org: OrganizationListItemData) => void;
    /** Callback when delete is clicked */
    onDelete?: (org: OrganizationListItemData) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function getPlanBadgeInfo(planSlug?: string | null) {
    switch (planSlug?.toLowerCase()) {
        case 'enterprise':
            return { variant: 'plan-enterprise' as const, icon: <Building2 className="h-3 w-3" />, label: 'Empresa' };
        case 'pro':
            return { variant: 'plan-pro' as const, icon: <Zap className="h-3 w-3" />, label: 'Profesional' };
        case 'teams':
            return { variant: 'plan-teams' as const, icon: <Users className="h-3 w-3" />, label: 'Equipos' };
        case 'free':
        default:
            return { variant: 'plan-free' as const, icon: <Sparkles className="h-3 w-3" />, label: 'Esencial' };
    }
}

// ============================================================================
// Component
// ============================================================================

export const OrganizationListItem = memo(function OrganizationListItem({
    organization,
    isActive = false,
    isOwner = false,
    switchLabel = "Cambiar",
    activeLabel = "ACTIVA",
    onSwitch,
    onDelete,
}: OrganizationListItemProps) {
    const logoUrl = organization.logo_url || null;
    const planInfo = getPlanBadgeInfo(organization.plans?.slug);

    // Solo el dueño puede eliminar, y nunca la org activa
    const canDelete = isOwner && !isActive && !!onDelete;

    return (
        <ListItem variant="card">
            {/* Logo */}
            <ListItem.Leading>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center overflow-hidden ${logoUrl ? '' : 'bg-primary/10'}`}>
                    {logoUrl ? (
                        <img src={logoUrl} alt={organization.name} className="h-full w-full object-cover" />
                    ) : (
                        <Building className="h-5 w-5 text-primary" />
                    )}
                </div>
            </ListItem.Leading>

            {/* Name + Plan badge + Members */}
            <ListItem.Content>
                <ListItem.Title>
                    {organization.name}
                    <Badge variant={planInfo.variant} icon={planInfo.icon} className="text-[10px] px-1.5 py-0 ml-2 align-middle">
                        {planInfo.label}
                    </Badge>
                </ListItem.Title>
                <div className="mt-1">
                    <AvatarStack members={organization.members || []} max={4} size={8} />
                </div>
            </ListItem.Content>

            {/* Switch / Active badge */}
            <ListItem.Trailing>
                {isActive ? (
                    <Badge variant="success" icon={<Check className="h-3 w-3" />} className="px-3 py-1">
                        {activeLabel}
                    </Badge>
                ) : onSwitch ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSwitch(organization)}
                    >
                        {switchLabel}
                    </Button>
                ) : null}
            </ListItem.Trailing>

            {/* Actions: Delete only */}
            {canDelete && (
                <ListItem.Actions>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground group-hover:text-foreground"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDelete!(organization)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar Organización
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ListItem.Actions>
            )}
        </ListItem>
    );
});
