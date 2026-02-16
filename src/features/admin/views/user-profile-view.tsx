"use client";

import { AdminUserDetail } from "@/features/admin/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import {
    Mail,
    Phone,
    MessageCircle,
    Globe,
    Calendar,
    Clock,
    Monitor,
    Shield,
    Building,
    Copy,
    ExternalLink,
    Palette,
    Languages,
    Layout,
    PanelLeft,
    Eye,
    Fingerprint,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { formatDistanceToNowStrict, format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { getViewName } from "@/lib/view-name-map";

interface UserProfileViewProps {
    user: AdminUserDetail;
}

export function UserProfileView({ user }: UserProfileViewProps) {
    const isOnline = user.last_seen_at &&
        (new Date().getTime() - new Date(user.last_seen_at).getTime() < 1000 * 60 * 5);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado`);
    };

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
        const h = Math.floor(seconds / 3600);
        const m = Math.round((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="space-y-6 pb-8">
            {/* ═══════════════════════════════════════════════════════════
                HERO SECTION
            ═══════════════════════════════════════════════════════════ */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        {/* Avatar */}
                        <Avatar className="h-24 w-24 border-2 border-border">
                            <AvatarImage src={user.avatar_url || ""} alt={user.full_name || user.email} />
                            <AvatarFallback className="text-2xl uppercase">
                                {user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)}
                            </AvatarFallback>
                        </Avatar>

                        {/* User Info */}
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-2xl font-bold">{user.full_name || "Sin nombre"}</h2>
                                {isOnline ? (
                                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none gap-1.5 pl-1.5 pr-2.5 h-6">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                        </span>
                                        Activo ahora
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="shadow-none">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {user.last_seen_at
                                            ? formatDistanceToNowStrict(new Date(user.last_seen_at), { addSuffix: true, locale: es })
                                            : "Nunca conectado"}
                                    </Badge>
                                )}
                                {!user.is_active && (
                                    <Badge variant="destructive" className="shadow-none">Desactivado</Badge>
                                )}
                                {user.role_id === 'd5606324-af8d-487e-8c8e-552511fce2a2' && (
                                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-none gap-1">
                                        <Shield className="h-3 w-3" />
                                        Admin
                                    </Badge>
                                )}
                            </div>

                            {/* Current view */}
                            {isOnline && user.current_view && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Monitor className="h-3.5 w-3.5" />
                                    <span>Viendo: <span className="font-medium text-foreground">{getViewName(user.current_view)}</span></span>
                                </div>
                            )}

                            {/* Quick IDs */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Fingerprint className="h-3 w-3" />
                                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">{user.id}</code>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(user.id, "ID")}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>

                            {/* Registration info */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Registrado: {format(new Date(user.created_at), "d MMM yyyy", { locale: es })}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    {user.signup_completed ? (
                                        <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Onboarding completo</>
                                    ) : (
                                        <><XCircle className="h-3.5 w-3.5 text-orange-500" /> Onboarding pendiente</>
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* ═══ QUICK ACTIONS ═══ */}
                        <div className="flex flex-col gap-2 min-w-[180px]">
                            <Button
                                variant="outline"
                                className="justify-start gap-2"
                                onClick={() => window.open(`mailto:${user.email}`, '_blank')}
                            >
                                <Mail className="h-4 w-4" />
                                Enviar Email
                            </Button>
                            {user.phone_e164 && (
                                <Button
                                    variant="outline"
                                    className="justify-start gap-2"
                                    onClick={() => {
                                        const phone = user.phone_e164;
                                        if (phone) window.open(`https://wa.me/${phone.replace(/\+/g, '')}`, '_blank');
                                    }}
                                >
                                    <Phone className="h-4 w-4" />
                                    WhatsApp
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                className="justify-start gap-2"
                                onClick={() => window.open('/admin/support', '_self')}
                            >
                                <MessageCircle className="h-4 w-4" />
                                Ver Soporte
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════
                KPIs ROW
            ═══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DashboardKpiCard
                    title="Sesiones"
                    value={user.total_sessions}
                    icon={<Eye className="h-5 w-5" />}
                    description="Total de sesiones registradas"
                />
                <DashboardKpiCard
                    title="Páginas Vistas"
                    value={user.total_pageviews}
                    icon={<Monitor className="h-5 w-5" />}
                    description="Total de vistas de página"
                />
                <DashboardKpiCard
                    title="Tiempo Total"
                    value={formatDuration(user.total_time_seconds)}
                    icon={<Clock className="h-5 w-5" />}
                    description="Tiempo acumulado en la plataforma"
                />
            </div>

            {/* ═══════════════════════════════════════════════════════════
                INFO GRID
            ═══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Info */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            Contacto
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <InfoRow
                            label="Email"
                            value={user.email}
                            copyable
                            onCopy={() => copyToClipboard(user.email, "Email")}
                        />
                        <Separator />
                        <InfoRow
                            label="Teléfono"
                            value={user.phone_e164 || "No registrado"}
                            copyable={!!user.phone_e164}
                            onCopy={() => user.phone_e164 && copyToClipboard(user.phone_e164, "Teléfono")}
                        />
                        <Separator />
                        <InfoRow label="País" value={user.country_name || "No definido"} />
                        <Separator />
                        <InfoRow
                            label="Cumpleaños"
                            value={user.birthdate ? format(new Date(user.birthdate + 'T12:00:00'), "d MMM yyyy", { locale: es }) : "No registrado"}
                        />
                        {user.first_name && (
                            <>
                                <Separator />
                                <InfoRow label="Nombre" value={user.first_name} />
                            </>
                        )}
                        {user.last_name && (
                            <>
                                <Separator />
                                <InfoRow label="Apellido" value={user.last_name} />
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Preferences */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Palette className="h-4 w-4 text-muted-foreground" />
                            Preferencias
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <InfoRow
                            label="Tema"
                            value={user.theme === 'dark' ? '🌙 Oscuro' : user.theme === 'light' ? '☀️ Claro' : user.theme || '—'}
                        />
                        <Separator />
                        <InfoRow
                            label="Idioma"
                            value={user.language === 'es' ? '🇪🇸 Español' : user.language === 'en' ? '🇺🇸 Inglés' : user.language || '—'}
                            icon={<Languages className="h-3.5 w-3.5" />}
                        />
                        <Separator />
                        <InfoRow
                            label="Layout"
                            value={user.layout || '—'}
                            icon={<Layout className="h-3.5 w-3.5" />}
                        />
                        <Separator />
                        <InfoRow
                            label="Sidebar"
                            value={user.sidebar_mode || '—'}
                            icon={<PanelLeft className="h-3.5 w-3.5" />}
                        />
                        <Separator />
                        <InfoRow
                            label="Zona Horaria"
                            value={user.timezone || '—'}
                            icon={<Globe className="h-3.5 w-3.5" />}
                        />
                        <Separator />
                        <InfoRow
                            label="Avatar"
                            value={user.avatar_source || '—'}
                        />
                        {user.user_agent && (
                            <>
                                <Separator />
                                <div className="py-1">
                                    <span className="text-xs text-muted-foreground">User Agent</span>
                                    <p className="text-xs font-mono mt-0.5 break-all text-muted-foreground/80">{user.user_agent}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                ORGANIZATIONS
            ═══════════════════════════════════════════════════════════ */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        Organizaciones ({user.organizations.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {user.organizations.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No pertenece a ninguna organización</p>
                    ) : (
                        <div className="space-y-3">
                            {user.organizations.map((org) => (
                                <div key={org.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={org.logo_url || ""} alt={org.name} />
                                        <AvatarFallback className="uppercase text-xs">
                                            {org.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm truncate">{org.name}</span>
                                            {!org.is_active && (
                                                <Badge variant="outline" className="text-[10px] shadow-none">Inactivo</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            {org.role_name && (
                                                <span className="text-xs text-muted-foreground">{org.role_name}</span>
                                            )}
                                            {org.plan_name && (
                                                <Badge variant="secondary" className="text-[10px] h-4 shadow-none">{org.plan_name}</Badge>
                                            )}
                                            {org.joined_at && (
                                                <span className="text-xs text-muted-foreground">
                                                    desde {format(new Date(org.joined_at), "MMM yyyy", { locale: es })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => copyToClipboard(org.id, "ID Org")}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Helper: Info Row ────────────────────────────────────────────────
function InfoRow({
    label,
    value,
    icon,
    copyable,
    onCopy,
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
    copyable?: boolean;
    onCopy?: () => void;
}) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                {icon}
                {label}
            </span>
            <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">{value}</span>
                {copyable && onCopy && (
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onCopy}>
                        <Copy className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    );
}
