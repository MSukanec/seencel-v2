"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useUser } from "@/stores/user-store";
import { usePanel } from "@/stores/panel-store";
import { useLayoutStore } from "@/stores/layout-store";
import { HeaderIconButton } from "@/components/layout/dashboard/shared/header-icon-button";
import {
    Home,
    LayoutDashboard,
    Mail,
    Settings,
    LogOut,
    Monitor,
    Sun,
    Moon,
    Sparkles,
    ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// HEADER AVATAR BUTTON — User menu in the top-right corner
// ============================================================================
// Minimal trigger (avatar only), popover opens downward aligned to the right.
// Reads user data from the global user store (no props needed).
// Styles unified with SidebarNotificationsButton popover.
// ============================================================================

export function HeaderAvatarButton({ variant = 'header' }: { variant?: 'header' | 'sidebar' | 'sidebar-collapsed' }) {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const supabase = createClient();
    const user = useUser();
    const tUser = useTranslations('UserMenu');
    const { setTheme } = useTheme();

    const { openPanel } = usePanel();
    const pathname = usePathname();

    const name = user?.full_name || "Usuario";
    const email = user?.email || "";
    const avatarUrl = user?.avatar_url || "";

    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const handleFeedbackClick = () => {
        setOpen(false);
        openPanel('feedback-form');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const handleClose = () => setOpen(false);

    // Shared item classes — matches notifications popover density
    const itemClass = "flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted/50 cursor-pointer";

    const isSidebar = variant === 'sidebar' || variant === 'sidebar-collapsed';

    const triggerContent = variant === 'sidebar' ? (
        // Sidebar expanded: Avatar + Name + Email + Chevrons
        <button
            className={cn(
                "flex items-center cursor-pointer transition-all w-full px-2 py-1.5 gap-2.5 rounded-xl text-left",
                "bg-white/[0.03] border border-white/[0.08]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)]",
                "hover:bg-white/[0.05] hover:border-white/[0.11]",
                "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_3px_8px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.25)]",
                "text-sidebar-foreground",
                open && "bg-white/[0.05] border-white/[0.11]"
            )}
        >
            <div className={cn(
                "shrink-0 rounded-full flex items-center justify-center",
                "h-8 w-8 bg-black/20 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.35),inset_0_0.5px_1px_rgba(0,0,0,0.25)] border border-white/[0.04]"
            )}>
                <Avatar className="h-6 w-6 rounded-full shrink-0">
                    <AvatarImage src={avatarUrl} alt={name} />
                    <AvatarFallback className="text-[10px] rounded-full bg-primary/10 text-primary font-medium">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold truncate w-full leading-tight">
                    {name.split(' ')[0]}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight truncate w-full">
                    {email}
                </span>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        </button>
    ) : variant === 'sidebar-collapsed' ? (
        // Sidebar collapsed: Avatar only, matching OrgSelector square sizing
        <button
            className={cn(
                "flex items-center justify-center w-11 h-[44px] rounded-xl transition-all cursor-pointer",
                "bg-white/[0.03] border border-white/[0.08]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)]",
                "hover:bg-white/[0.05] hover:border-white/[0.11]",
                "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_3px_8px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.25)]",
                open && "bg-white/[0.05] border-white/[0.11]"
            )}
        >
            <div className={cn(
                "shrink-0 rounded-full flex items-center justify-center",
                "h-8 w-8 bg-black/20 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.35),inset_0_0.5px_1px_rgba(0,0,0,0.25)] border border-white/[0.04]"
            )}>
                <Avatar className="h-6 w-6 rounded-full shrink-0">
                    <AvatarImage src={avatarUrl} alt={name} />
                    <AvatarFallback className="text-[10px] rounded-full bg-primary/10 text-primary font-medium">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            </div>
        </button>
    ) : (
        // Header: Original icon button trigger
        <HeaderIconButton active={open} className="p-0">
            <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback className="text-xs rounded-full bg-primary/10 text-primary font-medium">
                    {initials}
                </AvatarFallback>
            </Avatar>
        </HeaderIconButton>
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {triggerContent}
            </PopoverTrigger>

            <PopoverContent
                side={isSidebar ? "right" : "bottom"}
                align={isSidebar ? "end" : "end"}
                sideOffset={8}
                className="w-[240px] p-0"
            >
                {/* User Info Header — matches notifications header p-4 pb-2 */}
                <div className="flex items-center gap-3 p-4 pb-2">
                    <Avatar className="h-9 w-9 rounded-full shrink-0">
                        <AvatarImage src={avatarUrl} alt={name} />
                        <AvatarFallback className="text-xs rounded-full bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm leading-none truncate">{name}</span>
                        <span className="text-xs text-muted-foreground truncate mt-1">{email}</span>
                    </div>
                </div>

                <Separator />

                {/* Menu Items — dense, border-separated like notification items */}
                <div className="flex flex-col">
                    <Link
                        href="/settings"
                        onClick={() => {
                            // Save current path so "Volver a la app" works
                            if (!pathname.includes('/settings')) {
                                useLayoutStore.getState().actions.setPreviousPath(pathname);
                            }
                            handleClose();
                        }}
                        className={itemClass}
                    >
                        <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
                        {tUser('settings')}
                    </Link>
                    <button onClick={handleFeedbackClick} className={cn(itemClass, "w-full text-left")}>
                        <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
                        Reportar un Problema
                    </button>
                </div>

                <Separator />

                <div className="flex flex-col">
                    <a href="/?landing=true" onClick={handleClose} className={itemClass}>
                        <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                        {tUser('home')}
                    </a>
                    <Link href="/organization" onClick={handleClose} className={itemClass}>
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground shrink-0" />
                        Ir al Hub
                    </Link>
                    <Link href="/contact" onClick={handleClose} className={itemClass}>
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        Contacto
                    </Link>
                </div>

                <Separator />

                {/* Theme Toggle */}
                <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-muted-foreground">Tema</span>
                    <div className="flex items-center rounded-full border bg-background">
                        <Button variant="ghost" size="icon" onClick={() => setTheme("system")}
                            className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground" title="Sistema">
                            <Monitor className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setTheme("light")}
                            className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground" title="Claro">
                            <Sun className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setTheme("dark")}
                            className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground" title="Oscuro">
                            <Moon className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Logout — footer style like notifications "Ver todas" */}
                <div className="p-2">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:text-red-600 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        {tUser('logout')}
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
