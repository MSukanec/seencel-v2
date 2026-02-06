"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Users, ShoppingCart, AlertTriangle, CheckCircle } from "lucide-react";
import { Role } from "@/types/organization";
import { SeatStatus, getOrganizationSeatStatus } from "@/features/organization/actions";
import { Link } from "@/i18n/routing";

interface InviteMemberFormProps {
    organizationId: string;
    planId: string;
    roles: Role[];
}

export function InviteMemberForm({ organizationId, planId, roles }: InviteMemberFormProps) {
    const router = useRouter();
    const { closeModal, openModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
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

    // Callbacks internos - semi-autónomo
    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

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
            toast.error("Selecciona un rol");
            return;
        }

        setIsLoading(true);
        try {
            // TODO: Call sendInvitation action
            // await sendInvitation({ organizationId, email, roleId });

            toast.success("Invitación enviada correctamente");
            handleSuccess();
        } catch (error) {
            toast.error("Error al enviar la invitación");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoToCheckout = () => {
        // Navigate to checkout with seat purchase params
        closeModal();
        window.location.href = `/checkout?type=seats&org=${organizationId}&quantity=${seatsToBuy}`;
    };

    // Filter out system owner role
    const invitableRoles = roles.filter(r => r.type !== 'owner');

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (loadingSeats) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-muted-foreground">Cargando información de asientos...</div>
            </div>
        );
    }

    // Show purchase flow if no seats available
    if (showPurchaseFlow && seatStatus && !seatStatus.can_invite) {
        return (
            <div className="flex flex-col h-full min-h-0">
                <div className="flex-1 overflow-y-auto space-y-6">
                    {/* Current Status */}
                    <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">Estado Actual</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Incluidos en plan:</span>
                                <span className="ml-2 font-medium">{seatStatus.seats_included}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Comprados:</span>
                                <span className="ml-2 font-medium">{seatStatus.purchased}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">En uso:</span>
                                <span className="ml-2 font-medium">{seatStatus.used}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Pendientes:</span>
                                <span className="ml-2 font-medium">{seatStatus.pending_invitations}</span>
                            </div>
                        </div>
                    </div>

                    <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <AlertDescription>
                            No tenés asientos disponibles. Para invitar nuevos miembros, primero debés comprar asientos adicionales.
                        </AlertDescription>
                    </Alert>

                    <Separator />

                    {/* Purchase Form */}
                    <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Comprar Asientos
                        </h4>

                        <div className="flex items-center gap-4">
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
                                <div className="text-3xl font-bold">{seatsToBuy}</div>
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
                        <div className="rounded-lg border p-4 space-y-3">
                            {/* Proration Info */}
                            {seatStatus.days_remaining > 0 && (
                                <div className="flex items-center justify-between text-sm bg-primary/10 -mx-4 -mt-4 px-4 py-2 rounded-t-lg">
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
                                <span className="text-green-500">{formatPrice(seatStatus.prorated_price)}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Cantidad</span>
                                <span>× {seatsToBuy}</span>
                            </div>

                            <Separator />

                            <div className="flex justify-between font-medium">
                                <span>Total a pagar hoy</span>
                                <span className="text-primary text-lg">
                                    {formatPrice(seatStatus.prorated_price * seatsToBuy)}
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
                    className="-mx-4 -mb-4 mt-6"
                    isLoading={false}
                    submitLabel="Ir a Checkout"
                    onCancel={handleCancel}
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
                        <Badge variant="secondary" className="text-base px-3 py-1">
                            {seatStatus.available} / {seatStatus.total_capacity}
                        </Badge>
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
                isLoading={isLoading}
                submitLabel="Enviar Invitación"
                onCancel={handleCancel}
            />
        </form>
    );
}
