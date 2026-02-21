"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, User, Building, CreditCard, GraduationCap, Receipt, Ticket, Crown, XCircle, CheckCircle2, Trash2, AlertTriangle } from "lucide-react";
import { getTestUserStatus, TestUserStatus, getAllUsers, getUserOrganizations, getCurrentUserAndOrg, cleanupTestPurchase, UserBasic, OrganizationBasic } from "../actions";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
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
import { toast } from "sonner";

function StatusBadge({ value, trueLabel = "Sí", falseLabel = "No" }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
    return value ? (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {trueLabel}
        </Badge>
    ) : (
        <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            {falseLabel}
        </Badge>
    );
}

function DataRow({ label, value, badge }: { label: string; value: React.ReactNode; badge?: React.ReactNode }) {
    return (
        <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2">
                {badge}
                <span className="text-sm font-medium">{value}</span>
            </div>
        </div>
    );
}

export function SupportToolsContainer() {
    // User/Org selection state (shared)
    const [users, setUsers] = useState<UserBasic[]>([]);
    const [organizations, setOrganizations] = useState<OrganizationBasic[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingOrgs, setLoadingOrgs] = useState(false);
    const [initialLoaded, setInitialLoaded] = useState(false);

    // Status data state
    const [status, setStatus] = useState<TestUserStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cleanup state
    const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
    const [cleaningUp, setCleaningUp] = useState(false);

    // Load all users and current user/org on mount
    useEffect(() => {
        async function loadInitialData() {
            setLoadingUsers(true);

            // Load users and current user in parallel
            const [usersResult, currentResult] = await Promise.all([
                getAllUsers(),
                getCurrentUserAndOrg()
            ]);

            if (usersResult.success && usersResult.users) {
                setUsers(usersResult.users);
            }

            // Set the current user as default if available
            if (currentResult.userId) {
                setSelectedUserId(currentResult.userId);

                // Also load their orgs and set current org
                const orgsResult = await getUserOrganizations(currentResult.userId);
                if (orgsResult.success && orgsResult.organizations) {
                    setOrganizations(orgsResult.organizations);
                    if (currentResult.orgId) {
                        setSelectedOrgId(currentResult.orgId);
                    }
                }
            }

            setLoadingUsers(false);
            setInitialLoaded(true);
        }
        loadInitialData();
    }, []);

    // Load organizations when user is changed (not on initial load)
    useEffect(() => {
        if (!selectedUserId || !initialLoaded) return;

        async function loadOrgs() {
            setLoadingOrgs(true);
            const result = await getUserOrganizations(selectedUserId);
            if (result.success && result.organizations) {
                setOrganizations(result.organizations);
                // Auto-select first org if only one
                if (result.organizations.length === 1) {
                    setSelectedOrgId(result.organizations[0].id);
                }
            }
            setLoadingOrgs(false);
        }
        loadOrgs();
    }, [selectedUserId, initialLoaded]);

    // Fetch status when both user and org are selected
    const fetchStatus = useCallback(async () => {
        if (!selectedUserId || !selectedOrgId) return;

        setLoading(true);
        setError(null);
        const result = await getTestUserStatus(selectedUserId, selectedOrgId);
        if (result.success && result.data) {
            setStatus(result.data);
        } else {
            setError(result.error || "Error desconocido");
        }
        setLoading(false);
    }, [selectedUserId, selectedOrgId]);

    // Auto-fetch when org is selected
    useEffect(() => {
        if (selectedUserId && selectedOrgId && initialLoaded) {
            fetchStatus();
        } else if (!selectedOrgId) {
            setStatus(null);
        }
    }, [selectedUserId, selectedOrgId, fetchStatus, initialLoaded]);

    // Convert to Combobox options
    const userOptions: ComboboxOption[] = users.map(u => ({
        value: u.id,
        label: `${u.email}${u.fullName ? ` (${u.fullName})` : ""}`,
    }));

    const orgOptions: ComboboxOption[] = organizations.map(o => ({
        value: o.id,
        label: `${o.name}${o.planName ? ` (${o.planName})` : " (Sin plan)"}`,
    }));

    // Get selected user/org for display
    const selectedUser = users.find(u => u.id === selectedUserId);
    const selectedOrg = organizations.find(o => o.id === selectedOrgId);

    return (
        <div className="space-y-6">
            {/* User Status Dashboard with selectors */}
            <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Estado de Usuario
                        </CardTitle>
                        <CardDescription>
                            {selectedUser ? selectedUser.email : "Selecciona un usuario"}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowCleanupConfirm(true)}
                            disabled={cleaningUp || !selectedUserId || !selectedOrgId}
                        >
                            {cleaningUp ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Resetear
                        </Button>
                        <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading || !selectedUserId || !selectedOrgId}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refrescar
                        </Button>
                    </div>
                </CardHeader>

                {/* User/Org Selectors using Combobox */}
                <CardContent className="pb-4 border-b border-border/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* User Selector */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Usuario</label>
                            <Combobox
                                value={selectedUserId}
                                onValueChange={(val) => {
                                    setSelectedUserId(val);
                                    setSelectedOrgId("");
                                    setOrganizations([]);
                                    setStatus(null);
                                }}
                                options={userOptions}
                                placeholder={loadingUsers ? "Cargando..." : "Seleccionar usuario"}
                                searchPlaceholder="Buscar por email o nombre..."
                                emptyMessage="No se encontraron usuarios"
                                disabled={loadingUsers}
                            />
                        </div>

                        {/* Org Selector */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Organización</label>
                            <Combobox
                                value={selectedOrgId}
                                onValueChange={setSelectedOrgId}
                                options={orgOptions}
                                placeholder={
                                    !selectedUserId ? "Selecciona usuario primero" :
                                        loadingOrgs ? "Cargando..." :
                                            organizations.length === 0 ? "Sin organizaciones" :
                                                "Seleccionar organización"
                                }
                                searchPlaceholder="Buscar organización..."
                                emptyMessage="No se encontraron organizaciones"
                                disabled={!selectedUserId || loadingOrgs || organizations.length === 0}
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Status Display */}
                {loading && (
                    <CardContent className="flex items-center justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Cargando estado...</span>
                    </CardContent>
                )}

                {error && (
                    <CardContent className="py-6 text-center text-destructive">
                        {error}
                    </CardContent>
                )}

                {!loading && !error && !status && selectedUserId && selectedOrgId && (
                    <CardContent className="py-6 text-center text-muted-foreground">
                        No se pudo cargar el estado
                    </CardContent>
                )}

                {!loading && !error && !selectedUserId && (
                    <CardContent className="py-10 text-center text-muted-foreground">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Selecciona un usuario para ver su estado
                    </CardContent>
                )}

                {status && (
                    <CardContent className="space-y-4 pt-4">
                        {/* Usuario + Organización — 2 columnas */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-4">
                                    <span className="flex items-center gap-1.5">
                                        <User className="h-4 w-4" />
                                        Usuario
                                    </span>
                                    <span className="text-muted-foreground">|</span>
                                    <span className="flex items-center gap-1.5">
                                        <Building className="h-4 w-4" />
                                        Organización
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-0">
                                    <DataRow label="ID" value={<code className="text-xs break-all">{status.user?.id}</code>} />
                                    <DataRow label="Auth ID" value={<code className="text-xs break-all">{status.user?.authId}</code>} />
                                    <DataRow label="Nombre" value={status.user?.fullName || "Sin nombre"} />
                                    <DataRow label="Email" value={status.user?.email} />
                                </div>
                                <div className="space-y-0">
                                    <DataRow label="Nombre" value={status.organization?.name || "Sin org"} />
                                    <DataRow
                                        label="Plan"
                                        value={status.organization?.planName || "Sin plan"}
                                        badge={status.organization?.planId ? (
                                            <Badge variant="default" className="bg-primary/10 text-primary">Activo</Badge>
                                        ) : (
                                            <Badge variant="secondary">Sin plan</Badge>
                                        )}
                                    />
                                    <DataRow
                                        label="Fundador"
                                        value=""
                                        badge={
                                            status.organization?.isFounder ? (
                                                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                                    <Crown className="h-3 w-3 mr-1" />
                                                    Sí
                                                </Badge>
                                            ) : <StatusBadge value={false} />
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Suscripción + Cursos — 2 columnas */}
                        <Card>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <div>
                                    <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                                        <CreditCard className="h-4 w-4" />
                                        Suscripción
                                    </h4>
                                    <div className="space-y-0">
                                        {status.subscription ? (
                                            <>
                                                <DataRow
                                                    label="Estado"
                                                    value={status.subscription.status}
                                                    badge={
                                                        <Badge className={status.subscription.status === "active" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}>
                                                            {status.subscription.status}
                                                        </Badge>
                                                    }
                                                />
                                                <DataRow label="Plan" value={status.subscription.planName} />
                                                <DataRow label="Período" value={status.subscription.billingPeriod} />
                                            </>
                                        ) : (
                                            <div className="py-4 text-center text-muted-foreground text-sm">
                                                Sin suscripción activa
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                                        <GraduationCap className="h-4 w-4" />
                                        Cursos Inscriptos
                                        <Badge variant="secondary">{status.enrollments.length}</Badge>
                                    </h4>
                                    <div className="space-y-0">
                                        {status.enrollments.length > 0 ? (
                                            status.enrollments.map(e => (
                                                <DataRow
                                                    key={e.id}
                                                    label={e.courseName}
                                                    value=""
                                                    badge={<Badge variant="outline">{e.status}</Badge>}
                                                />
                                            ))
                                        ) : (
                                            <div className="py-4 text-center text-muted-foreground text-sm">
                                                Sin inscripciones
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pagos + Cupones — 2 columnas */}
                        <Card>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <div>
                                    <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                                        <Receipt className="h-4 w-4" />
                                        Pagos Recientes
                                        <Badge variant="secondary">{status.payments.length}</Badge>
                                    </h4>
                                    <div className="space-y-0">
                                        {status.payments.length > 0 ? (
                                            status.payments.slice(0, 3).map(p => (
                                                <DataRow
                                                    key={p.id}
                                                    label={`${p.currency} ${p.amount}`}
                                                    value={p.productType}
                                                    badge={
                                                        <Badge className={p.status === "approved" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}>
                                                            {p.status}
                                                        </Badge>
                                                    }
                                                />
                                            ))
                                        ) : (
                                            <div className="py-4 text-center text-muted-foreground text-sm">
                                                Sin pagos
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                                        <Ticket className="h-4 w-4" />
                                        Cupones Usados
                                        <Badge variant="secondary">{status.couponRedemptions.length}</Badge>
                                    </h4>
                                    <div className="space-y-0">
                                        {status.couponRedemptions.length > 0 ? (
                                            status.couponRedemptions.map(c => (
                                                <DataRow
                                                    key={c.id}
                                                    label={c.couponCode}
                                                    value={new Date(c.redeemedAt).toLocaleDateString("es")}
                                                />
                                            ))
                                        ) : (
                                            <div className="py-4 text-center text-muted-foreground text-sm">
                                                Sin cupones usados
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </CardContent>
                )}
            </Card>

            {/* Cleanup Confirmation Dialog */}
            <AlertDialog open={showCleanupConfirm} onOpenChange={setShowCleanupConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            ¿Confirmar limpieza?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>Esto borrará <strong>TODOS</strong> los datos de compra de:</p>
                                <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                                    <p><strong>Email:</strong> {selectedUser?.email}</p>
                                    <p><strong>Organización:</strong> {selectedOrg?.name || selectedOrgId}</p>
                                </div>
                                <p>Se eliminarán:</p>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    <li>Enrollments de cursos</li>
                                    <li>Suscripciones de la organización</li>
                                    <li>Pagos y transferencias</li>
                                    <li>Preferencias de pago (MP, PayPal)</li>
                                    <li>Cupones usados</li>
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (!selectedUser?.email || !selectedOrgId) return;
                                setShowCleanupConfirm(false);
                                setCleaningUp(true);
                                try {
                                    const result = await cleanupTestPurchase(selectedUser.email, selectedOrgId);
                                    if (result.success) {
                                        toast.success(result.message);
                                        fetchStatus();
                                    } else {
                                        toast.error(result.message);
                                    }
                                } catch (err) {
                                    toast.error("Error al resetear datos");
                                } finally {
                                    setCleaningUp(false);
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Sí, eliminar todo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
