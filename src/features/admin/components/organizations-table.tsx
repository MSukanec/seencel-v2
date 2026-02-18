"use client";

import { useState } from "react";
import { AdminOrganization } from "../queries";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Link } from "@/i18n/routing";
import {
    Building, Building2, Clock, Users as UsersIcon, Sparkles,
    Eye, FolderKanban, Crown, Zap, Copy, Pencil
} from "lucide-react";
import { useOrganizationStore } from "@/stores/organization-store";
import { adminImpersonateOrg } from "@/actions/admin-impersonation-actions";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useModal } from "@/stores/modal-store";

// ============================================================================
// TYPES
// ============================================================================

interface Plan {
    id: string;
    name: string;
    slug: string | null;
}

interface OrganizationsTableProps {
    organizations: AdminOrganization[];
    plans?: Plan[];
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
        return { variant: 'plan-teams' as const, icon: <UsersIcon className="h-3 w-3" />, label: 'Equipos' };
    } else {
        return { variant: 'plan-free' as const, icon: <Sparkles className="h-3 w-3" />, label: 'Esencial' };
    }
}

function getStatusValue(org: AdminOrganization): string {
    if (!org.is_active) return "inactive";
    if (org.is_demo) return "demo";
    if (org.settings?.is_founder) return "founder";
    return "active";
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrganizationsTable({ organizations, plans = [] }: OrganizationsTableProps) {
    const activeOrgId = useOrganizationStore(state => state.activeOrgId);
    const setImpersonating = useOrganizationStore(state => state.setImpersonating);
    const { openModal } = useModal();

    const handleImpersonate = async (orgId: string, orgName: string) => {
        if (activeOrgId) {
            sessionStorage.setItem('seencel_original_org_id', activeOrgId);
        }
        setImpersonating(orgName);
        await adminImpersonateOrg(orgId);
    };

    const handleEditPlan = (org: AdminOrganization) => {
        const OrgQuickEditForm = require("./forms/org-quick-edit-form").OrgQuickEditForm;
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
    // COLUMNS
    // ========================================

    const columns: ColumnDef<AdminOrganization>[] = [
        // 1. Última Actividad
        {
            accessorKey: "last_activity_at",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Última Actividad" />,
            size: 180,
            cell: ({ row }) => {
                const lastActivity = row.original.last_activity_at
                    ? new Date(row.original.last_activity_at)
                    : null;

                if (lastActivity && (Date.now() - lastActivity.getTime() < 1000 * 60 * 5)) {
                    return (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none gap-1.5 pl-1.5 pr-2.5 h-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            Activo ahora
                        </Badge>
                    );
                }

                return (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                            {lastActivity
                                ? formatDistanceToNowStrict(lastActivity, { addSuffix: true, locale: es })
                                : "Sin actividad"
                            }
                        </span>
                    </div>
                );
            },
        },
        // 2. Organización (avatar + nombre + propietario) — clickable
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Organización" />,
            cell: ({ row }) => {
                const org = row.original;

                return (
                    <Link
                        href={{ pathname: "/admin/directory/organizations/[orgId]", params: { orgId: org.id } }}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={org.logo_url || ""} alt={org.name} />
                            <AvatarFallback className="uppercase">
                                {org.name.substring(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium leading-none underline-offset-4 hover:underline">
                                {org.name}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                                {org.owner_name
                                    ? `Propietario: ${org.owner_name}`
                                    : org.owner_email
                                        ? `Propietario: ${org.owner_email}`
                                        : "Sin propietario"
                                }
                            </span>
                        </div>
                    </Link>
                );
            },
            enableHiding: false,
        },
        // 3. Miembros
        {
            accessorKey: "member_count",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Miembros" />,
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <UsersIcon className="h-3.5 w-3.5" />
                    <span>{row.original.member_count}</span>
                </div>
            ),
        },
        // 4. Proyectos
        {
            accessorKey: "project_count",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Proyectos" />,
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <FolderKanban className="h-3.5 w-3.5" />
                    <span>{row.original.project_count}</span>
                </div>
            ),
        },
        // 5. Plan (con filtro facetado)
        {
            id: "plan",
            accessorFn: (row) => {
                const planInfo = getPlanBadgeInfo(row.plan_name);
                return planInfo.label;
            },
            header: ({ column }) => <DataTableColumnHeader column={column} title="Plan" />,
            size: 120,
            cell: ({ row }) => {
                const planInfo = getPlanBadgeInfo(row.original.plan_name);
                return (
                    <Badge variant={planInfo.variant} className="pointer-events-none gap-1 font-normal">
                        {planInfo.icon}
                        {planInfo.label}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        // 6. Estado (con filtro facetado)
        {
            id: "status",
            accessorFn: (row) => getStatusValue(row),
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            size: 150,
            cell: ({ row }) => {
                const org = row.original;
                const isFounder = org.settings?.is_founder === true;

                return (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {isFounder && (
                            <Badge variant="founder" className="shadow-none gap-1 font-normal">
                                <Crown className="h-3 w-3 fill-current" />
                                Fundador
                            </Badge>
                        )}
                        {org.is_demo && (
                            <Badge variant="secondary" className="shadow-none font-normal">
                                Demo
                            </Badge>
                        )}
                        {!org.is_active && (
                            <Badge variant="destructive" className="shadow-none font-normal">
                                Inactivo
                            </Badge>
                        )}
                        {org.is_active && !org.is_demo && !isFounder && (
                            <Badge variant="outline" className="shadow-none font-normal text-emerald-600 border-emerald-500/20">
                                Activo
                            </Badge>
                        )}
                    </div>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
    ];

    // ========================================
    // FILTER OPTIONS
    // ========================================

    const planFilterOptions = [
        { label: "Esencial", value: "Esencial" },
        { label: "Profesional", value: "Profesional" },
        { label: "Equipos", value: "Equipos" },
        { label: "Empresa", value: "Empresa" },
    ];

    const statusFilterOptions = [
        { label: "Activo", value: "active" },
        { label: "Inactivo", value: "inactive" },
        { label: "Demo", value: "demo" },
        { label: "Fundador", value: "founder" },
    ];

    // ========================================
    // RENDER
    // ========================================

    if (!organizations || organizations.length === 0) {
        return (
            <>
                <Toolbar portalToHeader />
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={Building}
                        viewName="Organizaciones"
                        featureDescription="Las organizaciones registradas en la plataforma aparecerán aquí. Cada organización puede tener miembros, proyectos y un plan asociado."
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Toolbar portalToHeader />
            <DataTable
                columns={columns}
                data={organizations}
                searchPlaceholder="Buscar organizaciones..."
                pageSize={20}
                showPagination={true}
                enableRowActions={true}
                facetedFilters={[
                    { columnId: "plan", title: "Plan", options: planFilterOptions },
                    { columnId: "status", title: "Estado", options: statusFilterOptions },
                ]}
                customActions={[
                    {
                        label: "Copiar ID",
                        icon: <Copy className="h-4 w-4" />,
                        onClick: (org: AdminOrganization) => {
                            navigator.clipboard.writeText(org.id);
                            toast.success("ID copiado");
                        },
                    },
                    {
                        label: "Editar Plan",
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (org: AdminOrganization) => handleEditPlan(org),
                    },
                    {
                        label: "Ver como esta org",
                        icon: <Eye className="h-4 w-4" />,
                        onClick: (org: AdminOrganization) => handleImpersonate(org.id, org.name),
                    },
                ]}
                initialSorting={[{ id: "last_activity_at", desc: true }]}
            />
        </>
    );
}
