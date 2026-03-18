"use client";

import { useEffect, useState, useTransition } from "react";
import { useOrganizationStore } from "@/stores/organization-store";
import { adminExitImpersonation, getAdminOrgList, adminImpersonateOrg } from "@/actions/admin-impersonation-actions";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";

interface OrgOption {
    id: string;
    name: string;
}

export function ImpersonationBanner() {
    const isImpersonating = useOrganizationStore(state => state.isImpersonating);
    const impersonationOrgName = useOrganizationStore(state => state.impersonationOrgName);
    const activeOrgId = useOrganizationStore(state => state.activeOrgId);
    const clearImpersonating = useOrganizationStore(state => state.clearImpersonating);
    const setImpersonating = useOrganizationStore(state => state.setImpersonating);

    const [orgs, setOrgs] = useState<OrgOption[]>([]);
    const [isPending, startTransition] = useTransition();

    // Fetch org list when banner is active
    useEffect(() => {
        if (!isImpersonating) return;

        getAdminOrgList().then(setOrgs).catch(console.error);
    }, [isImpersonating]);

    if (!isImpersonating) return null;

    const handleExit = () => {
        // Get original org from sessionStorage
        const originalOrgId = sessionStorage.getItem('seencel_original_org_id');
        if (!originalOrgId) return;

        sessionStorage.removeItem('seencel_original_org_id');
        clearImpersonating();

        startTransition(async () => {
            await adminExitImpersonation(originalOrgId);
        });
    };

    const handleSwitchOrg = (newOrgId: string) => {
        if (newOrgId === activeOrgId) return;

        const orgName = orgs.find(o => o.id === newOrgId)?.name || "Organización";
        setImpersonating(orgName);

        startTransition(async () => {
            await adminImpersonateOrg(newOrgId);
        });
    };

    const comboboxOptions = orgs.map(org => ({
        value: org.id,
        label: org.name,
    }));

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 dark:bg-amber-600 text-amber-950 px-4 py-1.5 flex items-center justify-center gap-3 text-sm font-medium shadow-md">
            <Shield className="h-4 w-4 shrink-0" />
            <span className="shrink-0">Modo Soporte —</span>

            {orgs.length > 0 ? (
                <Combobox
                    value={activeOrgId || ""}
                    onValueChange={handleSwitchOrg}
                    options={comboboxOptions}
                    placeholder="Seleccionar org..."
                    searchPlaceholder="Buscar organización..."
                    size="sm"
                    className="h-7 min-w-[200px] max-w-[300px] bg-amber-400/50 border-amber-600/30 text-amber-950 text-xs"
                />
            ) : (
                <span className="font-semibold">{impersonationOrgName}</span>
            )}

            <Button
                variant="outline"
                size="sm"
                onClick={handleExit}
                disabled={isPending}
                className="h-7 bg-amber-400/50 border-amber-600/30 text-amber-950 hover:bg-amber-400/80 hover:text-amber-950 text-xs"
            >
                <LogOut className="h-3 w-3 mr-1" />
                {isPending ? "Saliendo..." : "Salir"}
            </Button>
        </div>
    );
}
