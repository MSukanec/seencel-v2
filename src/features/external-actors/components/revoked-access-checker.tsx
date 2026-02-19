"use client";

import { useEffect, useRef, useState } from "react";
import { checkExternalActorAccess } from "@/features/external-actors/actions";
import { RevokedAccessOverlay } from "@/features/external-actors/components/revoked-access-overlay";

interface RevokedAccessCheckerProps {
    orgId: string | null;
    externalActorType: string | null;
}

/**
 * RevokedAccessChecker — mounts only for pure external users (no member role).
 *
 * Verifies on mount (and on tab focus) that the external actor's access
 * is still active. If revoked, shows a blocking overlay redirecting to the hub.
 *
 * Pattern: identical to PendingInvitationChecker (lazy, non-blocking on render).
 */
export function RevokedAccessChecker({ orgId, externalActorType }: RevokedAccessCheckerProps) {
    const [isRevoked, setIsRevoked] = useState(false);
    const checkedRef = useRef(false);

    const checkAccess = async () => {
        if (!orgId) return;
        try {
            const { isActive } = await checkExternalActorAccess(orgId);
            if (!isActive) {
                setIsRevoked(true);
            }
        } catch (err) {
            console.error("[RevokedAccessChecker] Failed to check access:", err);
        }
    };

    useEffect(() => {
        // Initial check on mount
        if (!checkedRef.current) {
            checkedRef.current = true;
            checkAccess();
        }

        // Re-check when user returns to tab (catches revocation while tab was hidden)
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                checkAccess();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId]);

    if (!isRevoked) return null;

    return <RevokedAccessOverlay externalActorType={externalActorType} />;
}
