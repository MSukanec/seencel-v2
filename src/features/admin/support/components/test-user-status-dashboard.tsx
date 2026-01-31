"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, User, Building, CreditCard, GraduationCap, Receipt, Ticket, Crown, XCircle, CheckCircle2 } from "lucide-react";
import { getTestUserStatus, TestUserStatus, getAllUsers, getUserOrganizations, UserBasic, OrganizationBasic } from "../actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export function TestUserStatusDashboard() {
    // User/Org selection state
    const [users, setUsers] = useState<UserBasic[]>([]);
    const [organizations, setOrganizations] = useState<OrganizationBasic[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingOrgs, setLoadingOrgs] = useState(false);

    // Status data state
    const [status, setStatus] = useState<TestUserStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load all users on mount
    useEffect(() => {
        async function loadUsers() {
            setLoadingUsers(true);
            const result = await getAllUsers();
            if (result.success && result.users) {
                setUsers(result.users);
            }
            setLoadingUsers(false);
        }
        loadUsers();
    }, []);

    // Load organizations when user is selected
    useEffect(() => {
        if (!selectedUserId) {
            setOrganizations([]);
            setSelectedOrgId("");
            return;
        }

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
    }, [selectedUserId]);

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
        if (selectedUserId && selectedOrgId) {
            fetchStatus();
        } else {
            setStatus(null);
        }
    }, [selectedUserId, selectedOrgId, fetchStatus]);

    // Get selected user/org names for display
    const selectedUser = users.find(u => u.id === selectedUserId);
    const selectedOrg = organizations.find(o => o.id === selectedOrgId);

    return (
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
                <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading || !selectedUserId || !selectedOrgId}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refrescar
                </Button>
            </CardHeader>

            {/* User/Org Selectors */}
            <CardContent className="pb-4 space-y-3 border-b border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User Selector */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Usuario</label>
                        <Select
                            value={selectedUserId}
                            onValueChange={(val) => {
                                setSelectedUserId(val);
                                setSelectedOrgId("");
                                setStatus(null);
                            }}
                            disabled={loadingUsers}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={loadingUsers ? "Cargando..." : "Seleccionar usuario"} />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.email} {user.fullName ? `(${user.fullName})` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Org Selector */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Organización</label>
                        <Select
                            value={selectedOrgId}
                            onValueChange={setSelectedOrgId}
                            disabled={!selectedUserId || loadingOrgs || organizations.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={
                                    !selectedUserId ? "Selecciona usuario primero" :
                                        loadingOrgs ? "Cargando..." :
                                            organizations.length === 0 ? "Sin organizaciones" :
                                                "Seleccionar organización"
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {organizations.map((org) => (
                                    <SelectItem key={org.id} value={org.id}>
                                        {org.name} {org.planName ? `(${org.planName})` : "(Sin plan)"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    {/* Usuario */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Usuario
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0">
                            <DataRow label="ID" value={<code className="text-xs">{status.user?.id?.slice(0, 8)}...</code>} />
                            <DataRow label="Nombre" value={status.user?.fullName || "Sin nombre"} />
                            <DataRow label="Email" value={status.user?.email} />
                        </CardContent>
                    </Card>

                    {/* Organización */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                Organización
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0">
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
                        </CardContent>
                    </Card>

                    {/* Suscripción */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Suscripción
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0">
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
                        </CardContent>
                    </Card>

                    {/* Enrollments */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <GraduationCap className="h-4 w-4" />
                                Cursos Inscriptos
                                <Badge variant="secondary">{status.enrollments.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0">
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
                        </CardContent>
                    </Card>

                    {/* Pagos */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Receipt className="h-4 w-4" />
                                Pagos Recientes
                                <Badge variant="secondary">{status.payments.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0">
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
                        </CardContent>
                    </Card>

                    {/* Cupones */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Ticket className="h-4 w-4" />
                                Cupones Usados
                                <Badge variant="secondary">{status.couponRedemptions.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0">
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
                        </CardContent>
                    </Card>
                </CardContent>
            )}
        </Card>
    );
}
