"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useUser } from "@/stores/user-store";
import { UserPopover } from "./popovers/user-popover";

// ============================================================================
// SIDEBAR USER BUTTON — Thin wrapper
// ============================================================================
// Shows user avatar only (no border, no card style).
// Organization display is handled by SidebarOrgSelector.
// ============================================================================

interface SidebarUserButtonProps {
    isExpanded?: boolean;
}

export function SidebarUserButton({ isExpanded = true }: SidebarUserButtonProps) {
    const [open, setOpen] = React.useState(false);
    const user = useUser();

    const name = user?.full_name || "Usuario";
    const avatarUrl = user?.avatar_url || "";
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const avatar = (
        <Avatar className="h-8 w-8 rounded-full shrink-0">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="text-[10px] rounded-full bg-primary/10 text-primary font-medium">
                {initials}
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
                <UserPopover onClose={() => setOpen(false)} />
            </PopoverContent>
        </Popover>
    );
}
