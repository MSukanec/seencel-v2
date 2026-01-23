'use client';

import { Button } from "@/components/ui/button";
import { switchOrganization } from "../actions";
import { useTransition } from "react";

interface SwitchOrganizationButtonProps {
    organizationId: string;
    currentOrgId: string;
    label: string;
}

export function SwitchOrganizationButton({ organizationId, currentOrgId, label }: SwitchOrganizationButtonProps) {
    const [isPending, startTransition] = useTransition();

    const isCurrent = organizationId === currentOrgId;

    const handleSwitch = () => {
        if (isCurrent) return;

        startTransition(async () => {
            try {
                await switchOrganization(organizationId);
                // The revalidatePath in the action should trigger a refresh
            } catch (error) {
                console.error("Failed to switch:", error);
                // Optionally show toast error
            }
        });
    };

    if (isCurrent) {
        return null;
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSwitch}
            disabled={isPending}
        >
            {isPending ? "Switching..." : label}
        </Button>
    );
}

