"use client";

import { useEffect } from "react";
import { captureAcquisitionParams } from "@/hooks/use-acquisition-params";

/**
 * Component that captures UTM acquisition parameters on mount
 * Should be placed in the root layout or landing pages
 * 
 * It only captures once per session to ensure accurate first-touch attribution
 */
export function AcquisitionTracker() {
    useEffect(() => {
        captureAcquisitionParams();
    }, []);

    // This component renders nothing - it's just a side-effect
    return null;
}
