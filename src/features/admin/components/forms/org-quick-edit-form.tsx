"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModal } from "@/stores/modal-store";
import { updateOrganizationPlan } from "@/features/admin/admin-org-actions";
import { toast } from "sonner";
import type { AdminPlan } from "@/features/admin/queries";

// ============================================================================
// TYPES
// ============================================================================

interface OrgQuickEditFormProps {
    orgId: string;
    orgName: string;
    currentPlanSlug: string | null;
    plans: AdminPlan[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrgQuickEditForm({
    orgId,
    orgName,
    currentPlanSlug,
    plans,
}: OrgQuickEditFormProps) {
    const { closeModal } = useModal();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Find the current plan by slug match
    const currentPlan = plans.find(p => p.slug === currentPlanSlug);
    const [selectedPlanId, setSelectedPlanId] = useState<string>(currentPlan?.id || "");

    const handleSubmit = () => {
        if (!selectedPlanId) return;
        if (selectedPlanId === currentPlan?.id) {
            closeModal();
            return;
        }

        startTransition(async () => {
            const result = await updateOrganizationPlan(orgId, selectedPlanId);
            if (result.success) {
                toast.success(`Plan de ${orgName} actualizado`);
                closeModal();
                router.refresh();
            } else {
                toast.error(result.error || "Error al actualizar el plan");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="plan-select">Plan</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                    <SelectTrigger id="plan-select" className="w-full">
                        <SelectValue placeholder="Seleccionar plan..." />
                    </SelectTrigger>
                    <SelectContent>
                        {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                                {plan.name}
                                {plan.slug ? ` (${plan.slug})` : ""}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    Plan actual: <span className="font-medium">{currentPlan?.name || "Sin plan"}</span>
                </p>
            </div>

            {/* Sticky Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={closeModal} disabled={isPending}>
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isPending || !selectedPlanId}>
                    {isPending ? "Guardando..." : "Guardar"}
                </Button>
            </div>
        </div>
    );
}
