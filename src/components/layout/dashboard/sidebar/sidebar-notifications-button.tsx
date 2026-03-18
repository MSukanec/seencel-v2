"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, NotificationsPopover } from "./popovers/notifications-popover";

// ============================================================================
// SIDEBAR NOTIFICATIONS BUTTON — Thin wrapper
// ============================================================================
// Composes: visual trigger + NotificationsPopover from popovers/
// ============================================================================

interface SidebarNotificationsButtonProps {
    isExpanded?: boolean;
    className?: string;
    /** 'sidebar' = original expandable button, 'quick-access' = compact icon-only */
    variant?: 'sidebar' | 'quick-access';
}

export function SidebarNotificationsButton({
    isExpanded = false,
    className,
    variant = 'sidebar',
}: SidebarNotificationsButtonProps) {
    const [open, setOpen] = React.useState(false);
    const { notifications, unreadCount, isPending, handleMarkRead, handleMarkAllRead } = useNotifications();

    const isQuickAccess = variant === 'quick-access';

    const buttonContent = isQuickAccess ? (
        <button
            className={cn(
                "flex items-center justify-center h-8 w-full rounded-lg transition-all duration-150 relative",
                "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.03]",
                open && "text-foreground bg-white/[0.04] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_3px_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)]",
                className
            )}
        >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600 ring-2 ring-sidebar animate-pulse" />
            )}
        </button>
    ) : (
        <button
            className={cn(
                "group relative flex items-center w-full rounded-lg transition-colors duration-0",
                "hover:bg-secondary/80 text-muted-foreground hover:text-foreground",
                "p-0 min-h-[32px]",
                open && "bg-secondary/50",
                className
            )}
        >
            <div className={cn(
                "w-8 h-8 flex items-center justify-center shrink-0 relative",
                "text-muted-foreground group-hover:text-foreground"
            )}>
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-sidebar animate-pulse" />
                )}
            </div>

            <span className={cn(
                "text-[13px] font-medium truncate transition-opacity duration-200 ease-in-out text-left",
                isExpanded ? "flex-1 opacity-100 ml-2" : "w-0 opacity-0 ml-0"
            )}>
                Notificaciones
            </span>

            {isExpanded && unreadCount > 0 && (
                <span className="mr-2 px-1.5 py-0.5 text-[10px] font-semibold bg-red-600 text-white rounded-full">
                    {unreadCount}
                </span>
            )}
        </button>
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {buttonContent}
            </PopoverTrigger>

            <PopoverContent
                className="w-[340px] p-0"
                side={isQuickAccess ? "bottom" : "top"}
                align="start"
                sideOffset={8}
            >
                <NotificationsPopover
                    notifications={notifications}
                    unreadCount={unreadCount}
                    isPending={isPending}
                    onMarkRead={handleMarkRead}
                    onMarkAllRead={handleMarkAllRead}
                    onClose={() => setOpen(false)}
                />
            </PopoverContent>
        </Popover>
    );
}
