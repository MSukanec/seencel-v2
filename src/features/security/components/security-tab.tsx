"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { Loader2, ShieldCheck, LogOut, Monitor } from "lucide-react";
import { TOTPSetup } from "./totp-setup";
import { Badge } from "@/components/ui/badge";
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

export function SecurityTab() {
    const t = useTranslations('Settings.Security');
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(true);
    const [factors, setFactors] = React.useState<any[]>([]);
    const [isSettingUpTOTP, setIsSettingUpTOTP] = React.useState(false);
    const [showDisableDialog, setShowDisableDialog] = React.useState(false);
    const [showCloseAllDialog, setShowCloseAllDialog] = React.useState(false);
    const [isClosingAllSessions, setIsClosingAllSessions] = React.useState(false);

    // Derived state
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
                alert(`Error al cerrar sesiones: ${error.message}`);
                setIsClosingAllSessions(false);
            } else {
                // Redirect to login after closing all sessions
                router.push('/login');
                router.refresh();
            }
        } catch (err: any) {
            console.error("Sign out exception:", err);
            alert(`Error inesperado: ${err.message}`);
            setIsClosingAllSessions(false);
        }
    };

    if (isLoading && factors.length === 0) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{t('title')}</CardTitle>
                    <CardDescription>{t('description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* 2FA Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
                            <div className="space-y-0.5">
                                <Label className="text-base flex items-center gap-2">
                                    {t('twoFactor')}
                                    {hasTOTP ? (
                                        <Badge variant="success" className="h-5 text-[10px] px-1.5"><ShieldCheck className="w-3 h-3 mr-1" /> {t('enabled')}</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="h-5 text-[10px] px-1.5">{t('disabled')}</Badge>
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

                    {/* Sessions Section */}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base flex items-center gap-2">
                                <Monitor className="w-4 h-4" />
                                Sesiones Activas
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Cierra todas tus sesiones en otros dispositivos si sospechas actividad no autorizada.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCloseAllDialog(true)}
                            disabled={isClosingAllSessions}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            {isClosingAllSessions ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <LogOut className="w-4 h-4 mr-2" />
                            )}
                            Cerrar Todas
                        </Button>
                    </div>

                </CardContent>
            </Card>

            {/* Disable 2FA Confirmation Dialog */}
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

            {/* Close All Sessions Confirmation Dialog */}
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
