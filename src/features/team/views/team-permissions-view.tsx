"use client";

import { Role, Permission, RolePermission } from "@/features/team/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ContentLayout } from "@/components/layout";
import { useMemo, useState, useTransition, useOptimistic } from "react";
import { Info, ShieldCheck, Database, Shield, Edit, Eye, User, Briefcase, Loader2 } from "lucide-react";
import { seedPermissions, toggleRolePermission } from "@/features/team/actions";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TeamPermissionsViewProps {
    organizationId: string;
    roles: Role[];
    permissions?: Permission[];
    rolePermissions?: RolePermission[];
}

// Map technical keys to user-friendly Spanish titles
const PermissionTranslations: Record<string, string> = {
    // Admin
    'admin.access': 'Acceso Administrativo',
    'plans.view': 'Ver Planes',
    'plans.manage': 'Gestionar Planes',
    'billing.view': 'Ver Facturación',
    'billing.manage': 'Gestionar Facturación',

    // Organization
    'organization.view': 'Ver Organización',
    'organization.manage': 'Editar Organización',
    'members.view': 'Ver Miembros',
    'members.manage': 'Gestionar Miembros',
    'roles.view': 'Ver Roles',
    'roles.manage': 'Gestionar Roles',

    // Contacts
    'contacts.view': 'Ver Contactos',
    'contacts.manage': 'Gestionar Contactos',
    'contact_categories.view': 'Ver Categorías de Contacto',
    'contact_categories.manage': 'Gestionar Categorías de Contacto',

    // Projects
    'projects.view': 'Ver Proyectos',
    'projects.manage': 'Gestionar Proyectos',
    'project_types.view': 'Ver Tipos de Proyecto',
    'project_types.manage': 'Gestionar Tipos de Proyecto',

    // Finance / Costs
    'general_costs.view': 'Ver Costos Generales',
    'general_costs.manage': 'Gestionar Costos Generales',
    'wallets.view': 'Ver Billeteras',
    'wallets.manage': 'Gestionar Billeteras',
};

// Map categories to user-friendly Spanish titles
const CategoryTranslations: Record<string, string> = {
    'admin': 'Administración del Sistema',
    'organization': 'Configuración de Organización',
    'contacts': 'Gestión de Contactos',
    'projects': 'Gestión de Proyectos',
    'general_costs': 'Finanzas y Costos',
    'system': 'Sistema'
};

// Helper to get icon for role
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
    const [isPending, startTransition] = useTransition();
    const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

    // Optimistic state for role permissions
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
            // Optimistic update
            setOptimisticPermissions({ roleId, permissionId, enabled: !currentValue });

            try {
                await toggleRolePermission(organizationId, roleId, permissionId, !currentValue);
                router.refresh();
            } catch (error) {
                toast.error('Error al actualizar permiso');
                // Revert will happen automatically on refresh
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

    // Filter roles based on user request: type === 'organization' && !is_system
    const filteredRoles = useMemo(() => {
        const strictMatches = roles.filter(r => (r.type === 'organization' || r.type === 'ORGANIZATION') && !r.is_system);
        if (strictMatches.length > 0) return strictMatches;
        return roles.filter(r => !r.is_system);
    }, [roles]);

    // Group permissions by category
    const permissionsByCategory = useMemo(() => {
        const grouped: Record<string, Permission[]> = {};
        permissions.forEach(p => {
            if (!grouped[p.category]) {
                grouped[p.category] = [];
            }
            grouped[p.category].push(p);
        });
        // Sort keys if needed, specific order
        return grouped;
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
    const firstCategory = Object.keys(permissionsByCategory)[0] || '';

    return (
        <ContentLayout variant="wide">
            <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-foreground">Matriz de Permisos</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Define con precisión qué acciones puede realizar cada rol en la organización.
                        </p>
                    </div>
                    {!hasPermissions && (
                        <Button onClick={handleSeed} disabled={isSeeding} variant="outline" size="sm">
                            <Database className="w-4 h-4 mr-2" />
                            {isSeeding ? "Generando..." : "Generar Permisos Base"}
                        </Button>
                    )}
                </div>

                {!hasPermissions ? (
                    <div className="p-12 text-center border rounded-xl bg-muted/10 dashed border-2 border-dashed border-muted">
                        <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground">No hay permisos definidos</h3>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto mb-6">
                            La base de datos de permisos está vacía. Genera los permisos predeterminados para comenzar a configurar tu organización.
                        </p>
                        <Button onClick={handleSeed} disabled={isSeeding}>
                            {isSeeding ? "Generando..." : "Generar Permisos del Sistema"}
                        </Button>
                    </div>
                ) : !hasRoles ? (
                    <div className="p-8 text-center border rounded-xl bg-muted/20">
                        <Info className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground">No se encontraron roles personalizados</h3>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                            Crea un rol personalizado (ej. "Manager") para ver la matriz de permisos y empezar a configurar accesos.
                        </p>
                    </div>
                ) : (
                    <Card className="border shadow-none bg-card overflow-hidden rounded-xl">
                        <Accordion type="single" collapsible defaultValue={firstCategory} className="w-full">
                            {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                                <AccordionItem key={category} value={category} className="border-b last:border-0">
                                    <AccordionTrigger className="hover:no-underline py-4 px-6 bg-muted/40 hover:bg-muted/50 transition-all border-b border-border/50">
                                        <span className="font-bold text-sm uppercase tracking-wider text-foreground">
                                            {CategoryTranslations[category] || category}
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-0">
                                        <Card className="border-0 shadow-none rounded-none bg-transparent">
                                            <div className="overflow-x-auto">
                                                <Table className="w-full">
                                                    <TableHeader>
                                                        <TableRow className="hover:bg-transparent border-b">
                                                            <TableHead className="w-[45%] text-xs uppercase tracking-wider font-semibold text-muted-foreground py-3 pl-6">
                                                                Permiso / Descripción
                                                            </TableHead>
                                                            {filteredRoles.map(role => {
                                                                const RoleIcon = getRoleIcon(role.name);
                                                                return (
                                                                    <TableHead key={role.id} className="text-center w-[150px] py-3 align-bottom">
                                                                        <div className="flex flex-col items-center gap-1.5">
                                                                            <Badge
                                                                                variant="secondary"
                                                                                className="bg-background border-border text-foreground font-medium px-4 py-1.5 text-xs whitespace-nowrap shadow-sm flex items-center gap-2"
                                                                            >
                                                                                <RoleIcon className="w-3 h-3 text-primary/80" />
                                                                                {role.name}
                                                                            </Badge>
                                                                        </div>
                                                                    </TableHead>
                                                                );
                                                            })}
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {categoryPermissions.map(permission => (
                                                            <TableRow key={permission.id} className="hover:bg-muted/50 transition-colors border-b last:border-0">
                                                                <TableCell className="w-[45%] py-4 pl-6 align-top">
                                                                    <div className="flex flex-col gap-1 pr-6">
                                                                        <span className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                                                                            {PermissionTranslations[permission.key] || permission.key}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground leading-relaxed">
                                                                            {permission.description}
                                                                        </span>
                                                                    </div>
                                                                </TableCell>
                                                                {filteredRoles.map(role => {
                                                                    const hasPermission = optimisticPermissions.some(rp => rp.role_id === role.id && rp.permission_id === permission.id);
                                                                    const isAdmin = role.name === 'Administrador';
                                                                    const isLoading = pendingChanges.has(`${role.id}-${permission.id}`);

                                                                    return (
                                                                        <TableCell key={`${role.id}-${permission.id}`} className="text-center p-0 align-middle">
                                                                            <div className="flex items-center justify-center h-full w-full py-4 transition-colors">
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
                                                                            </div>
                                                                        </TableCell>
                                                                    );
                                                                })}
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </Card>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </Card>
                )}
            </div>
        </ContentLayout>
    );
}
