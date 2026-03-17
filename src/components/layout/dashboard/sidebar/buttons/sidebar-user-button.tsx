"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useUser } from "@/stores/user-store";
import { useLayoutStore } from "@/stores/layout-store";
import { useLayoutData } from "@/hooks/use-layout-data";
import { usePanel } from "@/stores/panel-store";
import { switchOrganization, fetchUserOrganizationsLight } from "@/features/organization/actions";
import {
    Home,
    LayoutDashboard,
    Settings,
    LogOut,
    ChevronsUpDown,
    Check,
    Mail,
    ChevronRight,
    Building,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// SIDEBAR USER BUTTON — Unified user + organization control
// ============================================================================
// Single button at sidebar bottom. Shows:
//   Line 1: User avatar + first name
//   Line 2: Organization name (muted)
// Click: Opens compact popover (Command-style density) with:
//   - User menu (Settings, Feedback, Home, Hub, Contact)
//   - Org switcher
//   - Logout
// ============================================================================

function getOrgInitials(name: string) {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "??";
}

interface LightOrg {
    id: string;
    name: string;
    logo_url: string | null;
}

// Module-level cache for org list
let _cachedOrgs: LightOrg[] | null = null;
let _fetchPromise: Promise<LightOrg[]> | null = null;

function ensureOrgsFetch(): Promise<LightOrg[]> {
    if (_cachedOrgs) return Promise.resolve(_cachedOrgs);
    if (!_fetchPromise) {
        _fetchPromise = fetchUserOrganizationsLight().then(data => {
            _cachedOrgs = data;
            _fetchPromise = null;
            return data;
        });
    }
    return _fetchPromise;
}

// ── Hover Sub-popover for Org Switching ─────────────────────────────────

interface OrgSubMenuProps {
    orgName: string;
    orgs: LightOrg[];
    orgsLoaded: boolean;
    currentOrgId?: string;
    isSwitching: boolean;
    onSelectOrg: (orgId: string) => void;
    itemClass: string;
}

function OrgSubMenu({ orgName, orgs, orgsLoaded, currentOrgId, isSwitching, onSelectOrg, itemClass }: OrgSubMenuProps) {
    const [subOpen, setSubOpen] = React.useState(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const openSub = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setSubOpen(true);
    };
    const closeSub = () => {
        timerRef.current = setTimeout(() => setSubOpen(false), 150);
    };

    React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    return (
        <Popover open={subOpen} onOpenChange={setSubOpen}>
            <PopoverTrigger asChild>
                <button
                    onMouseEnter={openSub}
                    onMouseLeave={closeSub}
                    className={cn(itemClass, "w-full text-left justify-between")}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{orgName}</span>
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="right"
                align="start"
                sideOffset={4}
                className="w-[200px] p-1"
                onMouseEnter={openSub}
                onMouseLeave={closeSub}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="overflow-y-auto max-h-[200px]">
                    {!orgsLoaded ? (
                        <div className="px-2 py-2 text-xs text-muted-foreground text-center">
                            Cargando...
                        </div>
                    ) : (
                        orgs.map((org) => {
                            const isActive = org.id === currentOrgId;
                            return (
                                <button
                                    key={org.id}
                                    disabled={isSwitching}
                                    onClick={() => onSelectOrg(org.id)}
                                    className={cn(
                                        "flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md hover:bg-secondary transition-colors",
                                        isActive && "bg-secondary",
                                        isSwitching && "opacity-50 cursor-wait"
                                    )}
                                >
                                    <Avatar className="h-4 w-4 rounded-md shrink-0">
                                        {org.logo_url && <AvatarImage src={org.logo_url} alt={org.name} />}
                                        <AvatarFallback className="text-[7px] rounded-md bg-primary/10 text-primary font-semibold">
                                            {getOrgInitials(org.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate flex-1 text-left">{org.name}</span>
                                    {isActive && <Check className="h-3 w-3 text-muted-foreground shrink-0" />}
                                </button>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

interface SidebarUserButtonProps {
    isExpanded?: boolean;
}

export function SidebarUserButton({ isExpanded = true }: SidebarUserButtonProps) {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const user = useUser();
    const { currentOrg } = useLayoutData();
    const tUser = useTranslations('UserMenu');

    // Org switching state
    const [orgs, setOrgs] = React.useState<LightOrg[]>(_cachedOrgs ?? []);
    const [orgsLoaded, setOrgsLoaded] = React.useState(!!_cachedOrgs);
    const [isSwitching, setIsSwitching] = React.useState(false);

    // Fetch orgs on mount
    React.useEffect(() => {
        if (_cachedOrgs) {
            setOrgs(_cachedOrgs);
            setOrgsLoaded(true);
            return;
        }
        ensureOrgsFetch().then(data => {
            setOrgs(data);
            setOrgsLoaded(true);
        });
    }, []);

    // User data
    const name = user?.full_name || "Usuario";
    const email = user?.email || "";
    const avatarUrl = user?.avatar_url || "";
    const firstName = name.split(' ')[0];
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    // Org data
    const orgName = currentOrg?.name || "Sin organización";

    // Handlers
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const handleClose = () => setOpen(false);

    const handleSelectOrg = async (orgId: string) => {
        if (orgId === currentOrg?.id) {
            setOpen(false);
            return;
        }
        setOpen(false);
        setIsSwitching(true);
        _cachedOrgs = null;
        _fetchPromise = null;
        try {
            await switchOrganization(orgId);
        } catch {
            // switchOrganization does a redirect, which throws in Next.js
        }
        // Fallback: navigate to org dashboard
        const locale = window.location.pathname.split('/')[1] || 'es';
        window.location.href = `/${locale}/${locale === 'es' ? 'organizacion' : 'organization'}`;
    };

    // Org logo
    const orgLogoUrl = currentOrg?.logo_url || "";
    const orgInitials = orgName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    // Avatar cycling (user ↔ org) every 4s, paused when popover is open
    const [showOrg, setShowOrg] = React.useState(false);
    React.useEffect(() => {
        if (open || !orgLogoUrl) {
            setShowOrg(false);
            return;
        }
        const interval = setInterval(() => setShowOrg(prev => !prev), 4000);
        return () => clearInterval(interval);
    }, [open, orgLogoUrl]);

    // Compact item class — matches shared popovers (text-xs, tight padding)
    const itemClass = "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-secondary cursor-pointer";

    // ── Cycling Avatar ────────────────────────────────────────────────

    const cyclingAvatar = (
        <div className="relative h-8 w-8 shrink-0 rounded-full overflow-hidden">
            {/* User avatar */}
            <Avatar className={cn(
                "absolute inset-0 h-8 w-8 rounded-full transition-opacity duration-700",
                showOrg ? "opacity-0" : "opacity-100"
            )}>
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback className="text-[10px] rounded-full bg-primary/10 text-primary font-medium">
                    {initials}
                </AvatarFallback>
            </Avatar>
            {/* Org avatar */}
            {orgLogoUrl && (
                <Avatar className={cn(
                    "absolute inset-0 h-8 w-8 rounded-full transition-opacity duration-700",
                    showOrg ? "opacity-100" : "opacity-0"
                )}>
                    <AvatarImage src={orgLogoUrl} alt={orgName} />
                    <AvatarFallback className="text-[10px] rounded-full bg-secondary text-foreground font-medium">
                        {orgInitials}
                    </AvatarFallback>
                </Avatar>
            )}
        </div>
    );

    // ── Trigger ────────────────────────────────────────────────────────

    const triggerExpanded = (
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
            {cyclingAvatar}
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold truncate w-full leading-tight">
                    {firstName}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight truncate w-full">
                    {orgName}
                </span>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        </button>
    );

    const triggerCollapsed = (
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
            {cyclingAvatar}
        </button>
    );

    // ── Popover ────────────────────────────────────────────────────────

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {isExpanded ? triggerExpanded : triggerCollapsed}
            </PopoverTrigger>

            <PopoverContent
                side="right"
                align="end"
                sideOffset={8}
                className="w-[220px] p-0"
            >
                {/* User Info Header — compact */}
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

                {/* User Menu Items — compact */}
                <div className="p-1">
                    <Link
                        href="/settings"
                        onClick={() => {
                            if (!pathname.includes('/settings')) {
                                useLayoutStore.getState().actions.setPreviousPath(pathname);
                            }
                            handleClose();
                        }}
                        className={itemClass}
                    >
                        <Settings className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {tUser('settings')}
                    </Link>
                </div>

                <Separator />

                {/* Navigation Links — compact */}
                <div className="p-1">
                    <a href="/?landing=true" onClick={handleClose} className={itemClass}>
                        <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {tUser('home')}
                    </a>
                    <Link href="/contact" onClick={handleClose} className={itemClass}>
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        Contacto
                    </Link>
                </div>

                <Separator />

                {/* Organization Switcher — single item with hover sub-popover */}
                <div className="p-1">
                    <OrgSubMenu
                        orgName={orgName}
                        orgs={orgs}
                        orgsLoaded={orgsLoaded}
                        currentOrgId={currentOrg?.id}
                        isSwitching={isSwitching}
                        onSelectOrg={handleSelectOrg}
                        itemClass={itemClass}
                    />
                </div>

                <Separator />

                {/* Logout — same style as other items, no color change */}
                <div className="p-1">
                    <button
                        onClick={handleLogout}
                        className={cn(itemClass, "w-full text-left")}
                    >
                        <LogOut className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {tUser('logout')}
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
