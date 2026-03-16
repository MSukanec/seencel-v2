"use client";

import { memo } from "react";
import { ListItem } from "../list-item-base";
import { PlanBadge } from "@/components/shared/plan-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { EntityContextMenu } from "@/components/shared/entity-context-menu";
import { MoreVertical, Building, Trash2, Check } from "lucide-react";
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

    // Solo el dueño puede eliminar, y nunca la org activa
    const canDelete = isOwner && !isActive && !!onDelete;

    const content = (
        <ListItem variant="row">
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
                    <PlanBadge
                        planSlug={organization.plans?.slug}
                        linkToPricing={false}
                        micro
                        className="ml-2 align-middle"
                    />
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
        </ListItem>
    );

    if (canDelete) {
        return (
            <EntityContextMenu
                data={organization}
                onDelete={() => onDelete!(organization)}
            >
                {content}
            </EntityContextMenu>
        );
    }

    return content;
});
