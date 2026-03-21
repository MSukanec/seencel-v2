"use client";

import { Role, Permission, RolePermission } from "@/features/team/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useTransition, useOptimistic } from "react";
import {
    Info, ShieldCheck, Database, Shield, Edit, Eye, User, Briefcase, Loader2,
    HardHat, Landmark, FolderKanban, Handshake, Building2, KeyRound
} from "lucide-react";
import { seedPermissions, toggleRolePermission } from "@/features/team/actions";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/layout";
import { ListItem } from "@/components/shared/list-item";

interface TeamPermissionsViewProps {
    organizationId: string;
    roles: Role[];
    permissions?: Permission[];
    rolePermissions?: RolePermission[];
}

// ── Permission display config ──────────────────────────────────────────────
interface PermissionDisplay {
    label: string;
    description: string;
}

const PermissionTranslations: Record<string, PermissionDisplay> = {
    // Admin
    'admin.access': {
        label: 'Acceso Administrativo',
        description: 'Control total del sistema: planes, facturación y configuración global.',
    },

    // Organization
    'organization.view': {
        label: 'Ver Organización',
        description: 'Puede ver miembros, roles y la configuración de la organización.',
    },
    'organization.manage': {
        label: 'Gestionar Organización',
        description: 'Puede invitar miembros, editar roles y gestionar invitaciones.',
    },

    // Projects
    'projects.view': {
        label: 'Ver Proyectos',
        description: 'Puede ver proyectos y su información general.',
    },
    'projects.manage': {
        label: 'Gestionar Proyectos',
        description: 'Puede crear, editar y archivar proyectos.',
    },

    // Construction
    'construction.view': {
        label: 'Ver Construcción',
        description: 'Puede ver materiales, mano de obra, tareas, subcontratos y bitácora de obra.',
    },
    'construction.manage': {
        label: 'Gestionar Construcción',
        description: 'Puede crear y editar materiales, mano de obra, tareas, subcontratos y bitácora.',
    },

    // Finance
    'finance.view': {
        label: 'Ver Finanzas',
        description: 'Puede ver costos generales y la gestión financiera operativa.',
    },
    'finance.manage': {
        label: 'Gestionar Finanzas',
        description: 'Puede crear, editar y registrar pagos de costos generales.',
    },

    // Commercial
    'commercial.view': {
        label: 'Ver Área Comercial',
        description: 'Puede ver presupuestos, clientes y el portal de clientes.',
    },
    'commercial.manage': {
        label: 'Gestionar Área Comercial',
        description: 'Puede crear y editar presupuestos, clientes y compromisos.',
    },
};

// ── Category display config ────────────────────────────────────────────────
interface CategoryDisplay {
    label: string;
    icon: LucideIcon;
    description: string;
    order: number;
}

const CategoryConfig: Record<string, CategoryDisplay> = {
    'admin': {
        label: 'Administración',
        icon: KeyRound,
        description: 'Control del sistema, planes y facturación',
        order: 0,
    },
    'organization': {
        label: 'Organización',
        icon: Building2,
        description: 'Miembros, roles e invitaciones',
        order: 1,
    },
    'projects': {
        label: 'Proyectos',
        icon: FolderKanban,
        description: 'Gestión de proyectos',
        order: 2,
    },
    'construction': {
        label: 'Construcción',
        icon: HardHat,
        description: 'Materiales, mano de obra, tareas, subcontratos y bitácora',
        order: 3,
    },
    'finance': {
        label: 'Finanzas',
        icon: Landmark,
        description: 'Costos generales y operaciones financieras',
        order: 4,
    },
    'commercial': {
        label: 'Comercial',
        icon: Handshake,
        description: 'Presupuestos, clientes y portal',
        order: 5,
    },
};

// Helper to get icon for role badge
const getRoleIcon = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('admin')) return Shield;
    if (name.includes('edit') || name.includes('editor')) return Edit;
    if (name.includes('view') || name.includes('lector') || name.includes('ver')) return Eye;
    if (name.includes('manager') || name.includes('gestor')) return Briefcase;
    return User;
};

export function TeamPermissionsView({ organizationId, roles, permissions = [], rolePermissions = [] }: TeamPermissionsViewProps) {
    const router = useRouter();
    const [isSeeding, setIsSeeding] = useState(false);
    const [, startTransition] = useTransition();
    const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

    const [optimisticPermissions, setOptimisticPermissions] = useOptimistic(
        rolePermissions,
        (state, update: { roleId: string; permissionId: string; enabled: boolean }) => {
            if (update.enabled) {
                return [...state, { role_id: update.roleId, permission_id: update.permissionId } as RolePermission];
            } else {
                return state.filter(rp => !(rp.role_id === update.roleId && rp.permission_id === update.permissionId));
            }
        }
    );

    const handleTogglePermission = (roleId: string, permissionId: string, currentValue: boolean) => {
        const key = `${roleId}-${permissionId}`;
        setPendingChanges(prev => new Set(prev).add(key));

        startTransition(async () => {
            setOptimisticPermissions({ roleId, permissionId, enabled: !currentValue });

            try {
                await toggleRolePermission(organizationId, roleId, permissionId, !currentValue);
                router.refresh();
            } catch (error) {
                toast.error('Error al actualizar permiso');
                router.refresh();
            } finally {
                setPendingChanges(prev => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            }
        });
    };

    const filteredRoles = useMemo(() => {
        const strictMatches = roles.filter(r => (r.type === 'organization' || r.type === 'ORGANIZATION') && !r.is_system);
        if (strictMatches.length > 0) return strictMatches;
        return roles.filter(r => !r.is_system);
    }, [roles]);

    // Group permissions by category with proper ordering
    const sortedCategories = useMemo(() => {
        const grouped: Record<string, Permission[]> = {};
        permissions.forEach(p => {
            if (!grouped[p.category]) {
                grouped[p.category] = [];
            }
            grouped[p.category].push(p);
        });

        return Object.entries(grouped).sort(([a], [b]) => {
            const orderA = CategoryConfig[a]?.order ?? 99;
            const orderB = CategoryConfig[b]?.order ?? 99;
            return orderA - orderB;
        });
    }, [permissions]);

    const handleSeed = async () => {
        try {
            setIsSeeding(true);
            await seedPermissions("global");
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSeeding(false);
        }
    };

    const hasRoles = filteredRoles.length > 0;
    const hasPermissions = permissions.length > 0;

    return (
        <div className="space-y-6 pb-12">
            <PageIntro
                icon={ShieldCheck}
                title="Roles y Permisos"
                description="Matriz de control de acceso. Asigná permisos específicos a cada rol de tu organización."
            />
                {!hasPermissions && (
                    <div className="flex justify-end">
                        <Button onClick={handleSeed} disabled={isSeeding} variant="outline" size="sm">
                            <Database className="w-4 h-4 mr-2" />
                            {isSeeding ? "Generando..." : "Generar Permisos Base"}
                        </Button>
                    </div>
                )}


                <Card variant="inset" className="p-2 sm:p-4">
                    {/* Empty states */}
                {!hasPermissions ? (
                    <ViewEmptyState
                        mode="empty"
                        icon={ShieldCheck}
                        viewName="Permisos"
                        featureDescription="La base de datos de permisos está vacía. Genera los permisos predeterminados para comenzar."
                        onAction={handleSeed}
                        actionLabel={isSeeding ? "Generando..." : "Generar Permisos del Sistema"}
                    />
                ) : !hasRoles ? (
                    <ViewEmptyState
                        mode="empty"
                        icon={Info}
                        viewName="Permisos"
                        featureDescription="No se encontraron roles personalizados. Crea un rol personalizado para ver la matriz de permisos."
                    />
                ) : (
                    /* Permission categories */
                    <div className="space-y-6">
                        {sortedCategories.map(([category, categoryPermissions]) => {
                            const config = CategoryConfig[category];
                            const CategoryIcon = config?.icon ?? ShieldCheck;

                            return (
                                <div key={category} className="space-y-2">
                                    {/* Category header */}
                                    <div className="flex items-center gap-2.5 px-1 pt-2">
                                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                                            <CategoryIcon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-foreground">
                                                {config?.label ?? category}
                                            </h3>
                                            {config?.description && (
                                                <p className="text-xs text-muted-foreground">
                                                    {config.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Permission items */}
                                    <div className="space-y-2">
                                        {categoryPermissions.map(permission => {
                                            const display = PermissionTranslations[permission.key];
                                            const isManageType = permission.key.endsWith('.manage');

                                            return (
                                                <ListItem
                                                    key={permission.id}
                                                    variant="row"
                                                    className="w-full px-4 py-3"
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        {/* Left: Permission info */}
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <div className={cn(
                                                                "mt-0.5 flex items-center justify-center w-6 h-6 rounded-md shrink-0",
                                                                isManageType
                                                                    ? "bg-amber-500/10 text-white"
                                                                    : "bg-blue-500/10 text-white"
                                                            )}>
                                                                {isManageType
                                                                    ? <Edit className="w-3.5 h-3.5" />
                                                                    : <Eye className="w-3.5 h-3.5" />
                                                                }
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium text-foreground">
                                                                        {display?.label ?? permission.key}
                                                                    </span>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn(
                                                                            "text-[10px] px-1.5 py-0 h-4 font-medium border text-white",
                                                                            isManageType
                                                                                ? "border-amber-500/30"
                                                                                : "border-blue-500/30"
                                                                        )}
                                                                    >
                                                                        {isManageType ? 'Edición' : 'Lectura'}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                                                    {display?.description ?? permission.description}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Right: Role checkboxes */}
                                                        <div className="flex items-center gap-5 shrink-0 ml-4">
                                                            {filteredRoles.map(role => {
                                                                const hasPermission = optimisticPermissions.some(
                                                                    rp => rp.role_id === role.id && rp.permission_id === permission.id
                                                                );
                                                                const isAdmin = role.name === 'Administrador';
                                                                const isLoading = pendingChanges.has(`${role.id}-${permission.id}`);

                                                                return (
                                                                    <div
                                                                        key={`${role.id}-${permission.id}`}
                                                                        className="flex flex-col items-center gap-0.5 w-20"
                                                                    >
                                                                        {isLoading ? (
                                                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                                        ) : (
                                                                            <Checkbox
                                                                                checked={hasPermission}
                                                                                disabled={isAdmin}
                                                                                onCheckedChange={() => !isAdmin && handleTogglePermission(role.id, permission.id, hasPermission)}
                                                                                className={cn(
                                                                                    "h-5 w-5 transition-all border-2 rounded-[4px]",
                                                                                    isAdmin && "cursor-not-allowed opacity-60",
                                                                                    !isAdmin && "cursor-pointer hover:border-primary",
                                                                                    hasPermission
                                                                                        ? "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground"
                                                                                        : "border-input bg-card"
                                                                                )}
                                                                            />
                                                                        )}
                                                                        <span className="text-[10px] text-muted-foreground truncate max-w-full">
                                                                            {role.name}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </ListItem>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                </Card>
        </div>
    );
}
