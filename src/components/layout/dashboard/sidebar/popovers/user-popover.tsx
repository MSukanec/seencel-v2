"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useUser } from "@/stores/user-store";
import { useOrganizationStore } from "@/stores/organization-store";
import { useLayoutStore } from "@/stores/layout-store";
import { PlanBadge } from "@/components/shared/plan-badge";
import { Button } from "@/components/ui/button";
import {
    Home,
    Settings,
    LogOut,
    Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// USER POPOVER — Content + Logic
// ============================================================================
// Contains: user info header, menu links, logout.
// Organization switching is now handled by SidebarOrgSelector.
// Used by: SidebarUserButton (composes trigger + this popover content).
// ============================================================================

interface UserPopoverProps {
    onClose: () => void;
}

export function UserPopover({ onClose }: UserPopoverProps) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const user = useUser();
    const tUser = useTranslations('UserMenu');

    const name = user?.full_name || "Usuario";
    const email = user?.email || "";
    const avatarUrl = user?.avatar_url || "";
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const activeOrgId = useOrganizationStore((state) => state.activeOrgId);
    const planSlug = useOrganizationStore((state) => state.planSlug);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const itemClass = "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-secondary cursor-pointer";

    return (
        <>
            {/* User Info Header */}
            <div className="flex items-center gap-2.5 px-3 py-2.5">
                <Avatar className="h-7 w-7 rounded-full shrink-0">
                    <AvatarImage src={avatarUrl} alt={name} />
                    <AvatarFallback className="text-[10px] rounded-full bg-primary/10 text-primary">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-xs leading-none truncate">{name}</span>
                    <span className="text-[11px] text-muted-foreground truncate mt-0.5">{email}</span>
                </div>
            </div>

            <Separator />

            {/* Active Organization Plan Info */}
            {activeOrgId && (
                <>
                    <div className="px-3 py-2.5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground font-medium pt-0.5">
                                Plan actual
                            </span>
                            <PlanBadge planSlug={planSlug || 'free'} micro />
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full text-xs h-8"
                            onClick={onClose}
                        >
                            <Link href="/settings/billing/plans">
                                Mejorar plan
                            </Link>
                        </Button>
                    </div>
                    <Separator />
                </>
            )}

            {/* Settings */}
            <div className="p-1">
                <Link
                    href="/settings"
                    onClick={() => {
                        if (!pathname.includes('/settings')) {
                            useLayoutStore.getState().actions.setPreviousPath(pathname);
                        }
                        onClose();
                    }}
                    className={itemClass}
                >
                    <Settings className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {tUser('settings')}
                </Link>
            </div>

            <Separator />

            {/* Navigation Links */}
            <div className="p-1">
                <a href="/?landing=true" onClick={onClose} className={itemClass}>
                    <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {tUser('home')}
                </a>
                <Link href="/contact" onClick={onClose} className={itemClass}>
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    Contacto
                </Link>
            </div>

            <Separator />

            {/* Logout */}
            <div className="p-1">
                <button
                    onClick={handleLogout}
                    className={cn(itemClass, "w-full text-left")}
                >
                    <LogOut className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {tUser('logout')}
                </button>
            </div>
        </>
    );
}
