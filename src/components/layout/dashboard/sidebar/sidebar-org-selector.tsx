"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayoutData } from "@/hooks/use-layout-data";
import { useOrganization } from "@/stores/organization-store";
import { OrgSelectorPopover } from "./popovers/org-selector-popover";

// ============================================================================
// SIDEBAR ORG SELECTOR — Thin wrapper
// ============================================================================
// Shows: org avatar + name + plan name — opens OrgSelectorPopover.
// Visually identical to SidebarProjectSelector.
// ============================================================================

interface SidebarOrgSelectorProps {
    isExpanded?: boolean;
}

export function SidebarOrgSelector({ isExpanded = true }: SidebarOrgSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const { currentOrg } = useLayoutData();
    const { planSlug } = useOrganization();

    const orgName = currentOrg?.name || "Sin organización";
    const orgLogo = currentOrg?.logo_url || "";
    const orgInitials = orgName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Plan display name
    const planLabel = planSlug
        ? planSlug.charAt(0).toUpperCase() + planSlug.slice(1)
        : "Sin plan";

    // Collapsed sidebar: just show icon
    if (!isExpanded) {
        return (
            <div className="flex items-center justify-center w-full">
                <Avatar className="h-6 w-6 rounded-full shrink-0">
                    {orgLogo && <AvatarImage src={orgLogo} alt={orgName} />}
                    <AvatarFallback className="text-[8px] rounded-full bg-primary/10 text-primary font-semibold">
                        {orgInitials}
                    </AvatarFallback>
                </Avatar>
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
                    <Avatar className="h-8 w-8 rounded-full shrink-0">
                        {orgLogo && <AvatarImage src={orgLogo} alt={orgName} />}
                        <AvatarFallback className="text-[10px] rounded-full bg-primary/10 text-primary font-semibold">
                            {orgInitials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="text-sm font-semibold truncate w-full text-left leading-tight">
                            {orgName}
                        </span>
                        <span className="text-[11px] text-muted-foreground leading-tight truncate w-full text-left">
                            {planLabel}
                        </span>
                    </div>
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                </button>
            </PopoverTrigger>

            <PopoverContent
                side="right"
                align="start"
                sideOffset={12}
                className="w-[220px] p-0"
            >
                <OrgSelectorPopover onClose={() => setOpen(false)} />
            </PopoverContent>
        </Popover>
    );
}
