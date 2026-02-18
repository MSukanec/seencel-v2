"use client";

import { AdminOrganizationDetail, AdminPlan } from "../queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { useOrganizationStore } from "@/stores/organization-store";
import { adminImpersonateOrg } from "@/actions/admin-impersonation-actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
    Building2, Users, FolderKanban, Crown, Zap, Sparkles,
    Copy, Eye, Pencil, Mail, Calendar, Fingerprint,
    Shield, Clock, UserCheck, Armchair
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface OrgProfileViewProps {
    org: AdminOrganizationDetail;
    plans: AdminPlan[];
    showMembersOnly?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function getPlanBadgeInfo(planName?: string | null) {
    const normalized = planName?.toLowerCase() || 'free';
    if (normalized.includes('enterprise') || normalized.includes('empresa')) {
        return { variant: 'plan-enterprise' as const, icon: <Building2 className="h-3 w-3" />, label: 'Empresa' };
    } else if (normalized.includes('pro')) {
        return { variant: 'plan-pro' as const, icon: <Zap className="h-3 w-3" />, label: 'Profesional' };
    } else if (normalized.includes('team')) {
        return { variant: 'plan-teams' as const, icon: <Users className="h-3 w-3" />, label: 'Equipos' };
    } else {
        return { variant: 'plan-free' as const, icon: <Sparkles className="h-3 w-3" />, label: 'Esencial' };
    }
}

function InfoRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={`text-sm font-medium ${mono ? 'font-mono text-xs' : ''}`}>
                {value || "—"}
            </span>
        </div>
    );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrgProfileView({ org, plans, showMembersOnly }: OrgProfileViewProps) {
    const { openModal } = useModal();
    const activeOrgId = useOrganizationStore(state => state.activeOrgId);
    const setImpersonating = useOrganizationStore(state => state.setImpersonating);

    const planInfo = getPlanBadgeInfo(org.plan_name);
    const isFounder = org.settings?.is_founder === true;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado`);
    };

    const handleImpersonate = async () => {
        if (activeOrgId) {
            sessionStorage.setItem('seencel_original_org_id', activeOrgId);
        }
        setImpersonating(org.name);
        await adminImpersonateOrg(org.id);
    };

    const handleEditPlan = () => {
        const OrgQuickEditForm = require("../components/forms/org-quick-edit-form").OrgQuickEditForm;
        openModal(
            <OrgQuickEditForm
                orgId={org.id}
                orgName={org.name}
                currentPlanSlug={org.plan_slug}
                plans={plans}
            />,
            {
                title: "Editar Plan",
                description: `Cambiar plan de ${org.name}`,
                size: "sm"
            }
        );
    };

    // ========================================
    // MEMBERS-ONLY VIEW
    // ========================================

    if (showMembersOnly) {
        return (
            <div className="space-y-4 pb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Miembros Activos ({org.members.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {org.members.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No hay miembros activos.</p>
                        ) : (
                            <div className="space-y-3">
                                {org.members.map((member) => (
                                    <div key={member.id} className="flex items-center gap-3 py-2">
                                        <Link
                                            href={{ pathname: "/admin/directory/[userId]", params: { userId: member.user_id } }}
                                            className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                                        >
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={member.avatar_url || ""} alt={member.full_name || member.email} />
                                                <AvatarFallback className="uppercase text-xs">
                                                    {member.full_name ? member.full_name.charAt(0) : member.email.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className="text-sm font-medium truncate underline-offset-4 hover:underline">
                                                    {member.full_name || "Sin nombre"}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {member.email}
                                                </span>
                                            </div>
                                        </Link>
                                        <div className="flex items-center gap-2">
                                            {member.role_name && (
                                                <Badge variant="outline" className="shadow-none text-xs">
                                                    {member.role_name}
                                                </Badge>
                                            )}
                                            {member.joined_at && (
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {format(new Date(member.joined_at), "d MMM yyyy", { locale: es })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ========================================
    // FULL PROFILE VIEW
    // ========================================

    return (
        <div className="space-y-6 pb-8">
            {/* ═══════════════════════════════════════════════════════════
                HERO SECTION
            ═══════════════════════════════════════════════════════════ */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        {/* Logo */}
                        <Avatar className="h-24 w-24 border-2 border-border rounded-xl">
                            <AvatarImage src={org.logo_url || ""} alt={org.name} />
                            <AvatarFallback className="text-2xl uppercase rounded-xl">
                                {org.name.substring(0, 2)}
                            </AvatarFallback>
                        </Avatar>

                        {/* Org Info */}
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-2xl font-bold">{org.name}</h2>
                                <Badge variant={planInfo.variant} className="gap-1">
                                    {planInfo.icon}
                                    {planInfo.label}
                                </Badge>
                                {isFounder && (
                                    <Badge variant="founder" className="shadow-none gap-1">
                                        <Crown className="h-3 w-3 fill-current" />
                                        Fundador
                                    </Badge>
                                )}
                                {org.is_demo && (
                                    <Badge variant="secondary" className="shadow-none">Demo</Badge>
                                )}
                                {!org.is_active && (
                                    <Badge variant="destructive" className="shadow-none">Inactivo</Badge>
                                )}
                            </div>

                            {/* Owner */}
                            {(org.owner_name || org.owner_email) && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Shield className="h-3.5 w-3.5" />
                                    <span>Propietario: <span className="font-medium text-foreground">{org.owner_name || org.owner_email}</span></span>
                                </div>
                            )}

                            {/* Quick IDs */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Fingerprint className="h-3 w-3" />
                                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">{org.id}</code>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(org.id, "ID")}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>

                            {/* Registration */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                {org.created_at && (
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Creada: {format(new Date(org.created_at), "d MMM yyyy", { locale: es })}
                                    </span>
                                )}
                                {org.last_activity_at && (
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        Última actividad: {format(new Date(org.last_activity_at), "d MMM yyyy HH:mm", { locale: es })}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-col gap-2 min-w-[180px]">
                            <Button
                                variant="outline"
                                className="justify-start gap-2"
                                onClick={handleImpersonate}
                            >
                                <Eye className="h-4 w-4" />
                                Ver como esta org
                            </Button>
                            <Button
                                variant="outline"
                                className="justify-start gap-2"
                                onClick={handleEditPlan}
                            >
                                <Pencil className="h-4 w-4" />
                                Editar Plan
                            </Button>
                            {org.owner_email && (
                                <Button
                                    variant="outline"
                                    className="justify-start gap-2"
                                    onClick={() => window.open(`mailto:${org.owner_email}`, '_blank')}
                                >
                                    <Mail className="h-4 w-4" />
                                    Email al propietario
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════
                KPIs
            ═══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{org.member_count}</p>
                                <p className="text-xs text-muted-foreground">Miembros activos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <FolderKanban className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{org.project_count}</p>
                                <p className="text-xs text-muted-foreground">Proyectos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Armchair className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{org.purchased_seats}</p>
                                <p className="text-xs text-muted-foreground">Seats comprados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                INFO CARDS
            ═══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Organization Data */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Datos de la Organización
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y divide-border">
                            <InfoRow label="Plan" value={org.plan_name} />
                            <InfoRow label="Plan slug" value={org.plan_slug} mono />
                            <InfoRow label="Estado" value={org.is_active ? "Activo" : "Inactivo"} />
                            <InfoRow label="Demo" value={org.is_demo ? "Sí" : "No"} />
                            <InfoRow label="Fundador" value={isFounder ? "Sí" : "No"} />
                            {isFounder && org.settings?.founder_since && (
                                <InfoRow label="Fundador desde" value={org.settings.founder_since} />
                            )}
                            <InfoRow label="Business Mode" value={org.settings?.business_mode} />
                            <InfoRow label="Propietario" value={org.owner_name} />
                            <InfoRow label="Email propietario" value={org.owner_email} />
                        </div>
                    </CardContent>
                </Card>

                {/* Projects Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <FolderKanban className="h-4 w-4" />
                            Proyectos ({org.projects.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {org.projects.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No hay proyectos.</p>
                        ) : (
                            <div className="space-y-2">
                                {org.projects.slice(0, 10).map((project) => (
                                    <div key={project.id} className="flex items-center gap-3 py-1.5">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: project.color || '#94a3b8' }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium truncate block">{project.name}</span>
                                        </div>
                                        <Badge variant="outline" className="shadow-none text-xs capitalize">
                                            {project.status}
                                        </Badge>
                                        {project.code && (
                                            <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1 py-0.5 rounded">
                                                {project.code}
                                            </code>
                                        )}
                                    </div>
                                ))}
                                {org.projects.length > 10 && (
                                    <p className="text-xs text-muted-foreground pt-2">
                                        +{org.projects.length - 10} proyectos más
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                MEMBERS PREVIEW
            ═══════════════════════════════════════════════════════════ */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Miembros ({org.members.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {org.members.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay miembros activos.</p>
                    ) : (
                        <div className="space-y-2">
                            {org.members.slice(0, 5).map((member) => (
                                <div key={member.id} className="flex items-center gap-3 py-1.5">
                                    <Link
                                        href={{ pathname: "/admin/directory/[userId]", params: { userId: member.user_id } }}
                                        className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.avatar_url || ""} alt={member.full_name || member.email} />
                                            <AvatarFallback className="uppercase text-xs">
                                                {member.full_name ? member.full_name.charAt(0) : member.email.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium truncate block underline-offset-4 hover:underline">
                                                {member.full_name || "Sin nombre"}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate block">
                                                {member.email}
                                            </span>
                                        </div>
                                    </Link>
                                    {member.role_name && (
                                        <Badge variant="outline" className="shadow-none text-xs">
                                            {member.role_name}
                                        </Badge>
                                    )}
                                </div>
                            ))}
                            {org.members.length > 5 && (
                                <p className="text-xs text-muted-foreground pt-2">
                                    +{org.members.length - 5} miembros más en la pestaña "Miembros"
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
