"use client";

// ============================================================================
// PROFILE NOTIFICATIONS VIEW
// ============================================================================
// Vista de CONFIGURACIÓN de notificaciones (NO historial).
// Secciones: Push + Email.
// El historial completo irá en una página /notificaciones dedicada.
// ============================================================================

import { useState, useEffect } from "react";
import { Bell, BellRing, Mail, Smartphone, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { toast } from "sonner";

/**
 * Converts a base64 VAPID key to Uint8Array for subscription
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// ── Push subscription status ──
type PushStatus = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

export function ProfileNotificationsView() {
    const [pushStatus, setPushStatus] = useState<PushStatus>("loading");
    const [isToggling, setIsToggling] = useState(false);

    // ── Check push status on mount ──
    useEffect(() => {
        checkPushStatus();
    }, []);

    const checkPushStatus = async () => {
        // Check if push is supported
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            setPushStatus("unsupported");
            return;
        }

        // Check permission
        const permission = Notification.permission;
        if (permission === "denied") {
            setPushStatus("denied");
            return;
        }

        // Check if already subscribed
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setPushStatus(subscription ? "subscribed" : "unsubscribed");
        } catch {
            setPushStatus("unsubscribed");
        }
    };

    const handlePushToggle = async (enable: boolean) => {
        if (isToggling) return;
        setIsToggling(true);

        try {
            if (enable) {
                // Request permission if needed
                const permission = await Notification.requestPermission();
                if (permission !== "granted") {
                    setPushStatus("denied");
                    toast.error("Permiso de notificaciones denegado. Habilitalo desde la configuración del navegador.");
                    return;
                }

                // Subscribe
                const registration = await navigator.serviceWorker.ready;
                const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidKey) throw new Error("VAPID key not configured");

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
                });

                // Send subscription to server (API expects { subscription: {...} })
                const response = await fetch("/api/push/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ subscription: subscription.toJSON() }),
                });

                if (!response.ok) throw new Error("Error al registrar suscripción");

                setPushStatus("subscribed");
                toast.success("Notificaciones push activadas en este dispositivo");
            } else {
                // Unsubscribe
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();

                    // Remove from server
                    await fetch("/api/push/subscribe", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ endpoint: subscription.endpoint }),
                    });
                }

                setPushStatus("unsubscribed");
                toast.success("Notificaciones push desactivadas");
            }
        } catch (error) {
            console.error("Push toggle error:", error);
            toast.error("Error al cambiar las notificaciones push");
            await checkPushStatus(); // Re-check actual status
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <ContentLayout variant="settings">
            <SettingsSectionContainer>
                {/* ── Notificaciones Push ── */}
                <SettingsSection
                    icon={BellRing}
                    title="Notificaciones Push"
                    description="Recibí alertas en tiempo real directamente en tu dispositivo, incluso cuando no estés usando Seencel."
                >
                    <div className="space-y-4">
                        {/* Push toggle */}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-base">Este dispositivo</Label>
                                </div>
                                <p className="text-sm text-muted-foreground pl-6">
                                    {pushStatus === "loading" && "Verificando estado..."}
                                    {pushStatus === "unsupported" && "Tu navegador no soporta notificaciones push."}
                                    {pushStatus === "denied" && "Permiso denegado. Habilitalo desde la configuración del navegador."}
                                    {pushStatus === "subscribed" && "Las notificaciones push están activas."}
                                    {pushStatus === "unsubscribed" && "Activá las notificaciones push para recibir alertas en tiempo real."}
                                </p>
                            </div>
                            {pushStatus !== "unsupported" && pushStatus !== "loading" && (
                                <Switch
                                    checked={pushStatus === "subscribed"}
                                    onCheckedChange={handlePushToggle}
                                    disabled={isToggling || pushStatus === "denied"}
                                />
                            )}
                        </div>

                        {/* Permission denied warning */}
                        {pushStatus === "denied" && (
                            <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                <div className="text-sm text-destructive">
                                    <p className="font-medium">Permiso bloqueado</p>
                                    <p className="text-destructive/80 mt-1">
                                        Para habilitar las notificaciones push, hacé click en el ícono de candado en la barra de direcciones de tu navegador y cambiá el permiso de notificaciones.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </SettingsSection>

                {/* ── Notificaciones por Email ── */}
                <SettingsSection
                    icon={Mail}
                    title="Notificaciones por Email"
                    description="Configurá qué notificaciones querés recibir en tu correo electrónico."
                >
                    <div className="space-y-4">
                        {/* All email notifications */}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Resumen de actividad</Label>
                                <p className="text-sm text-muted-foreground">
                                    Recibí un resumen semanal de la actividad en tus organizaciones.
                                </p>
                            </div>
                            <Switch
                                checked={false}
                                disabled
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Invitaciones y menciones</Label>
                                <p className="text-sm text-muted-foreground">
                                    Cuando te inviten a una organización o te mencionen en un comentario.
                                </p>
                            </div>
                            <Switch
                                checked={true}
                                disabled
                            />
                        </div>

                        <p className="text-xs text-muted-foreground italic pl-1">
                            Más opciones de email próximamente.
                        </p>
                    </div>
                </SettingsSection>
            </SettingsSectionContainer>
        </ContentLayout>
    );
}
