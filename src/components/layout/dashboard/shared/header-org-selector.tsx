"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "@/i18n/routing";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { switchOrganization, fetchUserOrganizationsLight } from "@/features/organization/actions";
import { useLayoutData } from "@/hooks/use-layout-data";
import { useOrganization } from "@/stores/organization-store";

// ============================================================================
// ORG SELECTOR — Standalone component for selecting organizations
// Used in: Sidebar top (workspace context)
// ============================================================================

function getInitials(name: string) {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "??";
}

interface LightOrg {
    id: string;
    name: string;
    logo_url: string | null;
}

// ── Plan subtitle component ──
function PlanSubtitle() {
    const { planSlug } = useOrganization();
    const label = planSlug
        ? planSlug.charAt(0).toUpperCase() + planSlug.slice(1)
        : 'Free';
    return (
        <span className="text-[11px] text-muted-foreground leading-tight truncate w-full text-left">
            Plan {label}
        </span>
    );
}

// ── Module-level cache: survives component mount/unmount cycles ──
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

interface HeaderOrgSelectorProps {
    /** Render variant: "header" (compact breadcrumb) or "sidebar" (full width, taller) */
    variant?: "header" | "sidebar";
    /** Whether the sidebar is expanded (only relevant for variant="sidebar") */
    isExpanded?: boolean;
}

export function HeaderOrgSelector({ variant = "header", isExpanded = true }: HeaderOrgSelectorProps) {
    const { currentOrg } = useLayoutData();
    const [open, setOpen] = React.useState(false);
    // Initialize from cache if available (instant on remount)
    const [orgs, setOrgs] = React.useState<LightOrg[]>(_cachedOrgs ?? []);
    const [loaded, setLoaded] = React.useState(!!_cachedOrgs);
    const [isSwitching, setIsSwitching] = React.useState(false);
    const router = useRouter();

    // Fetch orgs on mount (reads from cache if already loaded)
    React.useEffect(() => {
        if (_cachedOrgs) {
            setOrgs(_cachedOrgs);
            setLoaded(true);
            return;
        }
        ensureOrgsFetch().then(data => {
            setOrgs(data);
            setLoaded(true);
        });
    }, []);

    // Early return AFTER all hooks
    if (!currentOrg) return null;

    const handleSelectOrg = async (orgId: string) => {
        if (orgId === currentOrg.id) {
            setOpen(false);
            return;
        }
        setOpen(false);
        setIsSwitching(true);
        // Invalidate org cache so next mount loads fresh
        _cachedOrgs = null;
        try {
            await switchOrganization(orgId);
        } catch {
            // switchOrganization does a redirect, which throws in Next.js
        }
        // Fallback: navigate to org dashboard (not current page, which may not exist in new org)
        const locale = window.location.pathname.split('/')[1] || 'es';
        window.location.href = `/${locale}/${locale === 'es' ? 'organizacion' : 'organization'}`;
    };

    const handleNewOrg = () => {
        setOpen(false);
        router.push('/workspace-setup');
    };

    const isSidebar = variant === "sidebar";

    // Collapsed sidebar: just show avatar, no popover
    if (isSidebar && !isExpanded) {
        return (
            <div className="flex items-center justify-center w-full">
                <Avatar className="h-6 w-6 rounded-md">
                    {currentOrg.logo_url && <AvatarImage src={currentOrg.logo_url} alt={currentOrg.name} />}
                    <AvatarFallback className="text-[8px] rounded-md bg-primary/10 text-primary font-bold">
                        {getInitials(currentOrg.name)}
                    </AvatarFallback>
                </Avatar>
            </div>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center cursor-pointer transition-all",
                        isSidebar
                            ? cn(
                                "w-full px-2 py-1.5 gap-2.5 rounded-xl",
                                "bg-white/[0.03] border border-white/[0.08]",
                                "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)]",
                                "hover:bg-white/[0.05] hover:border-white/[0.11]",
                                "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_3px_8px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.25)]",
                                "text-sidebar-foreground"
                              )
                            : "h-7 px-2 gap-1.5 rounded-lg hover:bg-secondary/80 text-foreground",
                        open && isSidebar && "bg-white/[0.05] border-white/[0.11]"
                    )}
                >
                    {/* Circular avatar — inset/recessed effect */}
                    <div className={cn(
                        "shrink-0 rounded-full flex items-center justify-center",
                        isSidebar
                            ? "h-8 w-8 bg-black/20 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.35),inset_0_0.5px_1px_rgba(0,0,0,0.25)] border border-white/[0.04]"
                            : "h-4 w-4"
                    )}>
                        {currentOrg.logo_url ? (
                            <Avatar className={cn(isSidebar ? "h-6 w-6" : "h-4 w-4", "rounded-full")}>
                                <AvatarImage src={currentOrg.logo_url} alt={currentOrg.name} className="rounded-full" />
                                <AvatarFallback className={cn(
                                    "rounded-full bg-transparent text-muted-foreground font-bold",
                                    isSidebar ? "text-[10px]" : "text-[7px]"
                                )}>
                                    {getInitials(currentOrg.name)}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <span className={cn(
                                "font-bold text-muted-foreground",
                                isSidebar ? "text-[11px]" : "text-[7px]"
                            )}>
                                {getInitials(currentOrg.name)}
                            </span>
                        )}
                    </div>
                    {/* Dual-row text */}
                    {isSidebar ? (
                        <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="text-sm font-semibold truncate w-full text-left leading-tight">
                                {currentOrg.name}
                            </span>
                            <PlanSubtitle />
                        </div>
                    ) : (
                        <span className="text-sm font-medium whitespace-nowrap truncate flex-1 text-left">
                            {currentOrg.name}
                        </span>
                    )}
                    <ChevronsUpDown className={cn(
                        "text-muted-foreground/50 shrink-0",
                        isSidebar ? "h-3.5 w-3.5" : "h-3 w-3"
                    )} />
                </button>
            </PopoverTrigger>

            <PopoverContent
                side={isSidebar ? "right" : "bottom"}
                align="start"
                sideOffset={isSidebar ? 12 : 8}
                className="w-[240px] p-0"
            >
                <div className="flex flex-col max-h-[320px]">
                    {/* Scrollable org list */}
                    <div className="overflow-y-auto p-1.5 flex-1 min-h-0">
                        {!loaded ? (
                            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                Cargando...
                            </div>
                        ) : (
                            orgs.map((org) => {
                                const isActive = org.id === currentOrg.id;
                                return (
                                    <button
                                        key={org.id}
                                        disabled={isSwitching}
                                        onClick={() => handleSelectOrg(org.id)}
                                        className={cn(
                                            "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-secondary transition-colors",
                                            isActive && "bg-secondary",
                                            isSwitching && "opacity-50 cursor-wait"
                                        )}
                                    >
                                        <Avatar className="h-5 w-5 rounded-md shrink-0">
                                            {org.logo_url && <AvatarImage src={org.logo_url} alt={org.name} />}
                                            <AvatarFallback className="text-[8px] rounded-md bg-primary/10 text-primary font-semibold">
                                                {getInitials(org.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate flex-1 text-left">{org.name}</span>
                                        {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Fixed bottom: New Org */}
                    <div className="border-t p-1.5 shrink-0">
                        <button
                            onClick={handleNewOrg}
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Nueva Organización</span>
                        </button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
