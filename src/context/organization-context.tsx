"use client";

import React, { createContext, useContext } from "react";
import { OrganizationPreferences } from "@/types/organization";

interface OrganizationContextType {
    activeOrgId: string | null;
    preferences: OrganizationPreferences | null;
}

const OrganizationContext = createContext<OrganizationContextType>({
    activeOrgId: null,
    preferences: null,
});

export function useOrganization() {
    return useContext(OrganizationContext);
}

export function OrganizationProvider({
    activeOrgId,
    preferences,
    children,
}: {
    activeOrgId: string | null;
    preferences: OrganizationPreferences | null;
    children: React.ReactNode;
}) {
    return (
        <OrganizationContext.Provider value={{ activeOrgId, preferences }}>
            {children}
        </OrganizationContext.Provider>
    );
}

