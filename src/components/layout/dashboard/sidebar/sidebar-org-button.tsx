"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useLayoutData } from "@/hooks/use-layout-data";
import { OrgSelectorPopover } from "./popovers/org-selector-popover";

// ============================================================================
// SIDEBAR ORG BUTTON — Compact avatar-only (for Activity Bar / Rail)
// ============================================================================
// Mirrors SidebarUserButton pattern: avatar + popover.
// Shows org logo/initials, opens OrgSelectorPopover on click.
// ============================================================================

interface SidebarOrgButtonProps {
    isExpanded?: boolean;
}

export function SidebarOrgButton({ isExpanded = true }: SidebarOrgButtonProps) {
    const [open, setOpen] = React.useState(false);
    const { currentOrg } = useLayoutData();

    const orgName = currentOrg?.name || "Sin organización";
    const orgLogo = currentOrg?.logo_url || "";
    const orgInitials = orgName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const avatar = (
        <Avatar className="h-8 w-8 rounded-full shrink-0">
            {orgLogo && <AvatarImage src={orgLogo} alt={orgName} />}
            <AvatarFallback className="text-[10px] rounded-full bg-primary/10 text-primary font-semibold">
                {orgInitials}
            </AvatarFallback>
        </Avatar>
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center justify-center rounded-full transition-all cursor-pointer",
                        "hover:ring-2 hover:ring-white/10",
                        open && "ring-2 ring-white/10"
                    )}
                >
                    {avatar}
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="right"
                align="end"
                sideOffset={8}
                className="w-[220px] p-0"
            >
                <OrgSelectorPopover onClose={() => setOpen(false)} />
            </PopoverContent>
        </Popover>
    );
}
