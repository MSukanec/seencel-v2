"use client";

import { AdminOrganization } from "../queries";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Building, Clock, Users as UsersIcon, Crown, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrganizationStore } from "@/stores/organization-store";
import { adminImpersonateOrg } from "@/actions/admin-impersonation-actions";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { getStorageUrl } from "@/lib/storage-utils";

interface OrganizationsTableProps {
    organizations: AdminOrganization[];
}

// Helper to get plan badge variant and icon
function getPlanBadgeInfo(planName?: string | null) {
    // Mapping name to slug-like logic since we only fetch name currently
    const normalizedName = planName?.toLowerCase() || 'free';

    if (normalizedName.includes('pro')) {
        return { variant: 'plan-pro' as const, icon: <Crown className="h-3 w-3" />, label: 'Pro' };
    } else if (normalizedName.includes('team')) {
        return { variant: 'plan-teams' as const, icon: <UsersIcon className="h-3 w-3" />, label: 'Teams' };
    } else {
        return { variant: 'plan-free' as const, icon: <Sparkles className="h-3 w-3" />, label: 'Free' };
    }
}

export function OrganizationsTable({ organizations }: OrganizationsTableProps) {
    const activeOrgId = useOrganizationStore(state => state.activeOrgId);
    const setImpersonating = useOrganizationStore(state => state.setImpersonating);

    const handleImpersonate = async (orgId: string, orgName: string) => {
        // Save current org to restore later
        if (activeOrgId) {
            sessionStorage.setItem('seencel_original_org_id', activeOrgId);
        }
        setImpersonating(orgName);
        await adminImpersonateOrg(orgId);
    };

    if (!organizations || organizations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/5">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Building className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p>No se encontraron organizaciones.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px]">Última Conexión</TableHead>
                        <TableHead>Organización</TableHead>
                        <TableHead className="text-center">Miembros</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-center w-[150px]">Status</TableHead>
                        <TableHead className="text-right w-[50px]">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {organizations.map((org) => {
                        const lastActivity = org.last_activity_at ? new Date(org.last_activity_at) : null;
                        const isFounder = org.settings?.is_founder === true;

                        // Avatar Logic
                        const logoPath = org.logo_path
                            ? (org.logo_path.startsWith('organizations/') ? org.logo_path : `organizations/${org.logo_path}`)
                            : null;
                        const logoUrl = getStorageUrl(logoPath, 'public-assets');

                        const planInfo = getPlanBadgeInfo(org.plan?.name);

                        return (
                            <TableRow key={org.id}>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {lastActivity && (new Date().getTime() - lastActivity.getTime() < 1000 * 60 * 5) ? (
                                            <div className="flex items-center">
                                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none gap-1.5 pl-1.5 pr-2.5 h-6">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    Activo ahora
                                                </Badge>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>
                                                    {lastActivity
                                                        ? formatDistanceToNowStrict(lastActivity, { addSuffix: true, locale: es })
                                                        : "Sin actividad"
                                                    }
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
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
                                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                <span>
                                                    {org.owner ? `Owner: ${org.owner.full_name || org.owner.email}` : "Sin owner"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                        <UsersIcon className="h-3.5 w-3.5" />
                                        <span>{org.members[0]?.count || 0}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={planInfo.variant} className="pointer-events-none gap-1 font-normal">
                                        {planInfo.icon}
                                        {planInfo.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    {isFounder && (
                                        <Badge variant="founder" className="shadow-none gap-1 font-normal">
                                            <Crown className="h-3 w-3 fill-current" />
                                            Founder
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Abrir menú</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(org.id)}>
                                                Copiar ID
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleImpersonate(org.id, org.name)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Ver como esta org
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

