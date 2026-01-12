"use client";

import React, { createContext, useContext } from "react";

interface OrganizationContextType {
    activeOrgId: string | null;
}

const OrganizationContext = createContext<OrganizationContextType>({
    activeOrgId: null,
});

export function useOrganization() {
    return useContext(OrganizationContext);
}

export function OrganizationProvider({
    activeOrgId,
    children,
}: {
    activeOrgId: string | null;
    children: React.ReactNode;
}) {
    return (
        <OrganizationContext.Provider value={{ activeOrgId }}>
            {children}
        </OrganizationContext.Provider>
    );
}
