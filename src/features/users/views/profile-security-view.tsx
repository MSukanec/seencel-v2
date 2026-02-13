"use client";

// ============================================================================
// PROFILE SECURITY VIEW
// ============================================================================
// Vista de seguridad usando SettingsSection layout.
// Secciones: Autenticación 2FA + Sesiones Activas.
// ============================================================================

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { Loader2, ShieldCheck, LogOut, Monitor } from "lucide-react";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { TOTPSetup } from "@/features/security/components/totp-setup";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ProfileSecurityView() {
    const t = useTranslations('Settings.Security');
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(true);
    const [factors, setFactors] = React.useState<any[]>([]);
    const [isSettingUpTOTP, setIsSettingUpTOTP] = React.useState(false);
    const [showDisableDialog, setShowDisableDialog] = React.useState(false);
    const [showCloseAllDialog, setShowCloseAllDialog] = React.useState(false);
    const [isClosingAllSessions, setIsClosingAllSessions] = React.useState(false);

    const totpFactor = factors.find(f => f.factor_type === 'totp' && f.status === 'verified');
    const hasTOTP = !!totpFactor;

    const supabase = createClient();

    const loadFactors = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (!error) {
            setFactors(data.all || []);
        }
        setIsLoading(false);
    };

    React.useEffect(() => {
        loadFactors();
    }, []);

    const handleConfirmDisable = async () => {
        if (!totpFactor?.id) return;
        setIsLoading(true);
        setShowDisableDialog(false);

        try {
            const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
            if (error) {
                console.error("Unenroll error:", error);
                alert(`Error al desactivar 2FA: ${error.message}`);
            } else {
                await loadFactors();
            }
        } catch (err: any) {
            console.error("Unenroll exception:", err);
            alert(`Error inesperado: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTOTPToggle = (checked: boolean) => {
        if (checked) {
            setIsSettingUpTOTP(true);
        } else {
            if (totpFactor && totpFactor.id) {
                setShowDisableDialog(true);
            }
        }
    };

    const handleCloseAllSessions = async () => {
        setIsClosingAllSessions(true);
        setShowCloseAllDialog(false);

        try {
            const { error } = await supabase.auth.signOut({ scope: 'global' });
            if (error) {
                console.error("Sign out error:", error);
                toast.error(`Error al cerrar sesiones: ${error.message}`);
                setIsClosingAllSessions(false);
            } else {
                router.push('/login');
                router.refresh();
            }
        } catch (err: any) {
            console.error("Sign out exception:", err);
            toast.error(`Error inesperado: ${err.message}`);
            setIsClosingAllSessions(false);
        }
    };

    if (isLoading && factors.length === 0) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    return (
        <>
            <ContentLayout variant="settings">
                <SettingsSectionContainer>
                    {/* ── Autenticación de Dos Factores ── */}
                    <SettingsSection
                        icon={ShieldCheck}
                        title={t('title')}
                        description={t('description')}
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base flex items-center gap-2">
                                        {t('twoFactor')}
                                        {hasTOTP ? (
                                            <Badge variant="success" className="h-5 text-[10px] px-1.5">
                                                <ShieldCheck className="w-3 h-3 mr-1" /> {t('enabled')}
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="h-5 text-[10px] px-1.5">
                                                {t('disabled')}
                                            </Badge>
                                        )}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('twoFactorDesc')}
                                    </p>
                                </div>
                                <Switch
                                    checked={hasTOTP || isSettingUpTOTP}
                                    onCheckedChange={handleTOTPToggle}
                                    disabled={isLoading || isSettingUpTOTP}
                                />
                            </div>

                            {isSettingUpTOTP && (
                                <TOTPSetup
                                    onSuccess={() => {
                                        setIsSettingUpTOTP(false);
                                        loadFactors();
                                    }}
                                    onCancel={() => setIsSettingUpTOTP(false)}
                                />
                            )}
                        </div>
                    </SettingsSection>

                    {/* ── Sesiones Activas ── */}
                    <SettingsSection
                        icon={Monitor}
                        title="Sesiones Activas"
                        description="Administra tus sesiones en otros dispositivos. Si sospechas actividad no autorizada, podés cerrar todas las sesiones activas de forma inmediata."
                    >
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Dispositivos Conectados</Label>
                                <p className="text-sm text-muted-foreground">
                                    Cerrar todas las sesiones cerrará tu sesión en todos los dispositivos, incluyendo este.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCloseAllDialog(true)}
                                disabled={isClosingAllSessions}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                            >
                                {isClosingAllSessions ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <LogOut className="w-4 h-4 mr-2" />
                                )}
                                Cerrar Todas
                            </Button>
                        </div>
                    </SettingsSection>
                </SettingsSectionContainer>
            </ContentLayout>

            {/* Disable 2FA Confirmation */}
            <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desactivar Autenticación de Dos Factores</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas desactivar la autenticación de dos factores?
                            Tu cuenta será menos segura sin esta protección adicional.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDisable}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Desactivar 2FA
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Close All Sessions Confirmation */}
            <AlertDialog open={showCloseAllDialog} onOpenChange={setShowCloseAllDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cerrar Todas las Sesiones</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esto cerrará tu sesión en todos los dispositivos, incluyendo este.
                            Deberás iniciar sesión nuevamente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCloseAllSessions}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Cerrar Todas las Sesiones
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
