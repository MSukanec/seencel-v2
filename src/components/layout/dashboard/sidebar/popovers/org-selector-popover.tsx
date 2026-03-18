"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayoutData } from "@/hooks/use-layout-data";
import { switchOrganization, fetchUserOrganizationsLight } from "@/features/organization/actions";

// ============================================================================
// ORG SELECTOR POPOVER — Content + Logic
// ============================================================================
// Shows: list of user's organizations with active indicator, switch logic.
// Used by: SidebarOrgSelector (composes trigger + this popover content).
// ============================================================================

interface LightOrg {
    id: string;
    name: string;
    logo_url: string | null;
}

function getOrgInitials(name: string) {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "??";
}

// Module-level cache for org list (shared)
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

// ── Popover Content ─────────────────────────────────────────────────────

interface OrgSelectorPopoverProps {
    onClose: () => void;
}

export function OrgSelectorPopover({ onClose }: OrgSelectorPopoverProps) {
    const { currentOrg } = useLayoutData();

    const [orgs, setOrgs] = React.useState<LightOrg[]>(_cachedOrgs ?? []);
    const [orgsLoaded, setOrgsLoaded] = React.useState(!!_cachedOrgs);
    const [isSwitching, setIsSwitching] = React.useState(false);

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

    const handleSelectOrg = async (orgId: string) => {
        if (orgId === currentOrg?.id) {
            onClose();
            return;
        }
        onClose();
        setIsSwitching(true);
        _cachedOrgs = null;
        _fetchPromise = null;
        try {
            await switchOrganization(orgId);
        } catch {
            // switchOrganization does a redirect, which throws in Next.js
        }
        const locale = window.location.pathname.split('/')[1] || 'es';
        window.location.href = `/${locale}/${locale === 'es' ? 'organizacion' : 'organization'}`;
    };

    return (
        <div className="flex flex-col max-h-[300px]">
            {/* Header */}
            <div className="px-3 py-2 shrink-0">
                <span className="font-semibold text-xs">Organizaciones</span>
            </div>
            <Separator />

            {/* Org list — scrollable */}
            <div className="overflow-y-auto flex-1 min-h-0 p-1">
                {!orgsLoaded ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                        Cargando...
                    </div>
                ) : orgs.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                        Sin organizaciones
                    </div>
                ) : (
                    orgs.map((org) => {
                        const isActive = org.id === currentOrg?.id;
                        return (
                            <button
                                key={org.id}
                                disabled={isSwitching}
                                onClick={() => handleSelectOrg(org.id)}
                                className={cn(
                                    "flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md hover:bg-secondary transition-colors",
                                    isActive && "bg-secondary",
                                    isSwitching && "opacity-50 cursor-wait"
                                )}
                            >
                                <Avatar className="h-5 w-5 rounded-full shrink-0">
                                    {org.logo_url && <AvatarImage src={org.logo_url} alt={org.name} />}
                                    <AvatarFallback className="text-[8px] rounded-full bg-primary/10 text-primary font-semibold">
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

            {/* Footer — create org */}
            <Separator />
            <div className="p-1 shrink-0">
                <button
                    onClick={() => {
                        onClose();
                        window.location.href = '/hub?create=org';
                    }}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                    <Plus className="h-3 w-3 shrink-0" />
                    Crear organización
                </button>
            </div>
        </div>
    );
}
