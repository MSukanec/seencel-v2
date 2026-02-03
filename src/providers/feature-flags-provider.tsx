"use client";

import * as React from "react";
import { FeatureFlag } from "@/actions/feature-flags";

interface FeatureFlagsContextType {
    flags: Record<string, boolean>; // boolean is derived from status (active=true)
    statuses: Record<string, 'active' | 'maintenance' | 'hidden' | 'founders' | 'coming_soon'>;
    isAdmin: boolean;
    isBetaTester: boolean;
}

const FeatureFlagsContext = React.createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({
    children,
    flags,
    isAdmin,
    isBetaTester
}: {
    children: React.ReactNode;
    flags: FeatureFlag[];
    isAdmin: boolean;
    isBetaTester: boolean;
}) {
    // Convert array to record for O(1) lookup
    const { flagsRecord, statusesRecord } = React.useMemo(() => {
        const fRecord: Record<string, boolean> = {};
        const sRecord: Record<string, 'active' | 'maintenance' | 'hidden' | 'founders' | 'coming_soon'> = {};

        flags.forEach(f => {
            fRecord[f.key] = f.value;
            sRecord[f.key] = f.status;
        });
        return { flagsRecord: fRecord, statusesRecord: sRecord };
    }, [flags]);

    return (
        <FeatureFlagsContext.Provider value={{
            flags: flagsRecord,
            statuses: statusesRecord,
            isAdmin,
            isBetaTester
        }}>
            {children}
        </FeatureFlagsContext.Provider>
    );
}

export function useFeatureFlags() {
    const context = React.useContext(FeatureFlagsContext);
    if (context === undefined) {
        throw new Error("useFeatureFlags must be used within a FeatureFlagsProvider");
    }
    return context;
}

