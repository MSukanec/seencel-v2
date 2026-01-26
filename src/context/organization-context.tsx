"use client";

import React, { createContext, useContext } from "react";
import { OrganizationPreferences } from "@/types/organization";

interface OrganizationContextType {
    activeOrgId: string | null;
    preferences: OrganizationPreferences | null;
    isFounder: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
    activeOrgId: null,
    preferences: null,
    isFounder: false,
});

export function useOrganization() {
    return useContext(OrganizationContext);
}

export function OrganizationProvider({
    activeOrgId,
    preferences,
    isFounder = false,
    children,
}: {
    activeOrgId: string | null;
    preferences: OrganizationPreferences | null;
    isFounder?: boolean;
    children: React.ReactNode;
}) {
    return (
        <OrganizationContext.Provider value={{ activeOrgId, preferences, isFounder }}>
            {children}
        </OrganizationContext.Provider>
    );
}

