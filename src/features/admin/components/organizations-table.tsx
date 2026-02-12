"use client";

import { AdminOrganization } from "../queries";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building, Building2, Clock, Users as UsersIcon, Sparkles, Eye, FolderKanban, Crown, Zap, Copy } from "lucide-react";
import { useOrganizationStore } from "@/stores/organization-store";
import { adminImpersonateOrg } from "@/actions/admin-impersonation-actions";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { getStorageUrl } from "@/lib/storage-utils";
import { toast } from "sonner";

interface OrganizationsTableProps {
    organizations: AdminOrganization[];
}

// Helper to get plan badge style
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

export function OrganizationsTable({ organizations }: OrganizationsTableProps) {
    const activeOrgId = useOrganizationStore(state => state.activeOrgId);
    const setImpersonating = useOrganizationStore(state => state.setImpersonating);

    const handleImpersonate = async (orgId: string, orgName: string) => {
        if (activeOrgId) {
            sessionStorage.setItem('seencel_original_org_id', activeOrgId);
        }
        setImpersonating(orgName);
        await adminImpersonateOrg(orgId);
    };

    const columns: ColumnDef<AdminOrganization>[] = [
        // 1. Última Actividad
        {
            accessorKey: "last_activity_at",
            header: "Última Actividad",
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
        // 2. Organización (avatar + nombre + propietario)
        {
            accessorKey: "name",
            header: "Organización",
            cell: ({ row }) => {
                const org = row.original;
                const logoPath = org.logo_path
                    ? (org.logo_path.startsWith('organizations/') ? org.logo_path : `organizations/${org.logo_path}`)
                    : null;
                const logoUrl = getStorageUrl(logoPath, 'public-assets');

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={logoUrl || ""} alt={org.name} />
                            <AvatarFallback className="uppercase">
                                {org.name.substring(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium leading-none">
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
                    </div>
                );
            },
        },
        // 3. Miembros
        {
            accessorKey: "member_count",
            header: "Miembros",
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
            header: "Proyectos",
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <FolderKanban className="h-3.5 w-3.5" />
                    <span>{row.original.project_count}</span>
                </div>
            ),
        },
        // 5. Plan
        {
            accessorKey: "plan_name",
            header: "Plan",
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
        },
        // 6. Estado (Founder, Demo, Inactivo)
        {
            accessorKey: "is_active",
            header: "Estado",
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
                    </div>
                );
            },
        },
    ];

    if (!organizations || organizations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/5">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Building className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p>No se encontraron organizaciones.</p>
            </div>
        );
    }

    return (
        <DataTable
            columns={columns}
            data={organizations}
            pageSize={20}
            showPagination={true}
            enableRowActions={true}
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
                    label: "Ver como esta org",
                    icon: <Eye className="h-4 w-4" />,
                    onClick: (org: AdminOrganization) => handleImpersonate(org.id, org.name),
                },
            ]}
            initialSorting={[{ id: "last_activity_at", desc: true }]}
        />
    );
}
