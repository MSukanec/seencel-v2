"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Users, ShoppingCart, AlertTriangle, CheckCircle } from "lucide-react";
import { Role, SeatStatus } from "@/features/team/types";
import { getOrganizationSeatStatus, sendInvitationAction } from "@/features/team/actions";
import { Link } from "@/i18n/routing";

interface InviteMemberFormProps {
    organizationId: string;
    planId: string;
    roles: Role[];
}

export function InviteMemberForm({ organizationId, planId, roles }: InviteMemberFormProps) {
    const router = useRouter();
    const { closeModal, openModal } = useModal();
    const [seatStatus, setSeatStatus] = useState<SeatStatus | null>(null);
    const [loadingSeats, setLoadingSeats] = useState(true);

    // Form state
    const [email, setEmail] = useState("");
    const [roleId, setRoleId] = useState("");

    // Seat purchase state (for bulk purchase flow)
    const [showPurchaseFlow, setShowPurchaseFlow] = useState(false);
    const [seatsToBuy, setSeatsToBuy] = useState(1);

    // Load seat status on mount
    useEffect(() => {
        const loadSeatStatus = async () => {
            setLoadingSeats(true);
            const result = await getOrganizationSeatStatus(organizationId);
            if (result.success && result.data) {
                setSeatStatus(result.data);
                // Auto-show purchase flow if no seats available
                if (!result.data.can_invite) {
                    setShowPurchaseFlow(true);
                }
            }
            setLoadingSeats(false);
        };
        loadSeatStatus();
    }, [organizationId]);

    const handleCancel = () => {
        closeModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("El email es obligatorio");
            return;
        }

        if (!roleId) {
            toast.error("Seleccioná un rol");
            return;
        }

        // Optimistic: close modal immediately and show toast
        const inviteEmail = email.trim();
        const inviteRoleId = roleId;
        closeModal();
        toast.success("Invitación enviada correctamente");

        // Server call in background
        try {
            const result = await sendInvitationAction(organizationId, inviteEmail, inviteRoleId);
            if (!result.success) {
                toast.error(result.error || "Error al enviar la invitación");
            }
            router.refresh();
        } catch (error) {
            toast.error("Error inesperado al enviar la invitación");
        }
    };

    const handleGoToCheckout = () => {
        // Navigate to checkout with seat purchase params (client-side, instant)
        closeModal();
        router.push(`/checkout?type=seats&org=${organizationId}&quantity=${seatsToBuy}` as any);
    };

    // Filter: only organization roles, exclude system roles and owner
    const invitableRoles = roles.filter(r => !r.is_system && r.type !== 'owner' && r.type !== 'web');

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (loadingSeats) {
        return (
            <div className="space-y-4 py-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
            </div>
        );
    }

    // Show purchase flow (triggered by no seats OR user clicks "buy more")
    if (showPurchaseFlow && seatStatus) {
        return (
            <div className="flex flex-col h-full min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Seat Balance */}
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1.5">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">Asientos</span>
                        </div>

                        {/* Capacity */}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Incluidos en el plan</span>
                            <span className="font-medium tabular-nums">{seatStatus.seats_included}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Comprados</span>
                            <span className="font-medium tabular-nums">{seatStatus.purchased}</span>
                        </div>
                        <Separator className="!my-1.5" />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Capacidad total</span>
                            <span className="font-semibold tabular-nums">{seatStatus.total_capacity}</span>
                        </div>

                        {/* Usage */}
                        <div className="flex justify-between mt-1">
                            <span className="text-muted-foreground">En uso</span>
                            <span className="font-medium tabular-nums">−{seatStatus.used}</span>
                        </div>
                        {seatStatus.pending_invitations > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Invitaciones pendientes</span>
                                <span className="font-medium tabular-nums">−{seatStatus.pending_invitations}</span>
                            </div>
                        )}
                        <Separator className="!my-1.5" />

                        {/* Available */}
                        <div className="flex justify-between">
                            <span className="font-medium">Disponibles</span>
                            <span className={`font-semibold tabular-nums ${seatStatus.available > 0 ? 'text-green-500' : 'text-destructive'}`}>
                                {seatStatus.available}
                            </span>
                        </div>
                    </div>

                    {!seatStatus.can_invite && (
                        <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <AlertDescription className="text-sm">
                                No tenés asientos disponibles. Para invitar nuevos miembros, primero debés comprar asientos adicionales.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Purchase Form */}
                    <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2 text-sm">
                            <ShoppingCart className="h-4 w-4" />
                            Comprar Asientos
                        </h4>

                        <div className="flex items-center justify-center gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setSeatsToBuy(Math.max(1, seatsToBuy - 1))}
                                disabled={seatsToBuy <= 1}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <div className="text-center min-w-[80px]">
                                <div className="text-2xl font-bold">{seatsToBuy}</div>
                                <div className="text-xs text-muted-foreground">
                                    {seatsToBuy === 1 ? "asiento" : "asientos"}
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setSeatsToBuy(seatsToBuy + 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Price Breakdown with Proration */}
                        <div className="rounded-lg border p-3 space-y-2">
                            {/* Proration Info */}
                            {seatStatus.days_remaining > 0 && (
                                <div className="flex items-center justify-between text-sm bg-primary/10 -mx-3 -mt-3 px-3 py-1.5 rounded-t-lg">
                                    <span className="text-muted-foreground">Días restantes del ciclo</span>
                                    <Badge variant="outline">{seatStatus.days_remaining} días</Badge>
                                </div>
                            )}

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Precio base ({seatStatus.billing_period === 'annual' ? 'anual' : 'mensual'})
                                </span>
                                <span className="line-through text-muted-foreground">
                                    {formatPrice(seatStatus.billing_period === 'annual' ? seatStatus.seat_price_annual : seatStatus.seat_price_monthly)}
                                </span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Precio prorrateado por seat</span>
                                <span className="text-green-500">{formatPrice(
                                    (seatStatus.billing_period === 'monthly'
                                        ? seatStatus.prorated_monthly
                                        : seatStatus.prorated_annual) ?? 0
                                )}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Cantidad</span>
                                <span>× {seatsToBuy}</span>
                            </div>

                            <Separator />

                            <div className="flex justify-between font-medium">
                                <span>Total a pagar hoy</span>
                                <span className="text-primary text-lg">
                                    {formatPrice(
                                        ((seatStatus.billing_period === 'monthly'
                                            ? seatStatus.prorated_monthly
                                            : seatStatus.prorated_annual) ?? 0) * seatsToBuy
                                    )}
                                </span>
                            </div>

                            {seatStatus.expires_at && (
                                <p className="text-xs text-muted-foreground text-center">
                                    Válido hasta el {new Date(seatStatus.expires_at).toLocaleDateString('es-AR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <FormFooter
                    className="-mx-4 -mb-4 mt-4"
                    isLoading={false}
                    isForm={false}
                    submitLabel="Ir a Checkout"
                    cancelLabel={seatStatus.can_invite ? "Volver" : "Cancelar"}
                    onCancel={seatStatus.can_invite ? () => setShowPurchaseFlow(false) : handleCancel}
                    onSubmit={handleGoToCheckout}
                />
            </div>
        );
    }

    // Normal invitation form (seats available)
    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4">
                {/* Seat Counter Badge */}
                {seatStatus && (
                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Asientos disponibles</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{seatStatus.available}</span> libres de <span className="font-semibold text-foreground">{seatStatus.total_capacity}</span>
                        </span>
                    </div>
                )}

                <FormGroup label="Email" required>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        autoComplete="off"
                    />
                </FormGroup>

                <FormGroup label="Rol" required>
                    <Select value={roleId} onValueChange={setRoleId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                            {invitableRoles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                    {role.name}
                                    {role.description && (
                                        <span className="text-muted-foreground ml-2 text-xs">
                                            - {role.description}
                                        </span>
                                    )}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormGroup>

                {/* Link to buy more seats */}
                {seatStatus && seatStatus.available <= 2 && (
                    <p className="text-xs text-muted-foreground">
                        ¿Necesitás más asientos?{" "}
                        <button
                            type="button"
                            onClick={() => setShowPurchaseFlow(true)}
                            className="text-primary hover:underline"
                        >
                            Comprar asientos adicionales
                        </button>
                    </p>
                )}
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={false}
                submitLabel="Enviar Invitación"
                onCancel={handleCancel}
            />
        </form>
    );
}
