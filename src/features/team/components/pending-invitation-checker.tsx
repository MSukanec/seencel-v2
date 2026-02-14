"use client";

import { useEffect, useState, useRef } from "react";
import { checkPendingInvitation, type PendingInvitationData } from "@/actions/invitation-actions";
import { PendingInvitationOverlay } from "@/features/team/components/pending-invitation-overlay";

interface PendingInvitationCheckerProps {
    email: string | null | undefined;
}

/**
 * Lazy invitation checker — runs AFTER layout mount (non-blocking).
 * Replaces the synchronous invitation check that was in the dashboard layout.
 * Pattern: identical to OrganizationStoreHydrator (Phase 2 lazy).
 */
export function PendingInvitationChecker({ email }: PendingInvitationCheckerProps) {
    const [invitation, setInvitation] = useState<PendingInvitationData | null>(null);
    const checkedRef = useRef(false);

    useEffect(() => {
        if (!email || checkedRef.current) return;
        checkedRef.current = true;

        checkPendingInvitation(email)
            .then((data) => {
                if (data) setInvitation(data);
            })
            .catch((error) => {
                console.error("Failed to check pending invitations:", error);
            });
    }, [email]);

    if (!invitation) return null;

    return <PendingInvitationOverlay invitation={invitation} />;
}
