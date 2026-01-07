"use client";

import { Role, Permission, RolePermission } from "@/types/organization";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { Info, ShieldCheck, Database } from "lucide-react";
import { seedPermissions } from "@/actions/organization-settings";
import { useRouter } from "@/i18n/routing";

interface PermissionsTabProps {
    roles: Role[];
    permissions?: Permission[];
    rolePermissions?: RolePermission[];
}

export function PermissionsTab({ roles, permissions = [], rolePermissions = [] }: PermissionsTabProps) {
    const router = useRouter();
    const [isSeeding, setIsSeeding] = useState(false);

    // Filter roles based on user request: type === 'organization' && !is_system
    const filteredRoles = useMemo(() => {
        const strictMatches = roles.filter(r => (r.type === 'organization' || r.type === 'ORGANIZATION') && !r.is_system);
        if (strictMatches.length > 0) return strictMatches;
        // Fallback to show something if strict is empty, but preferring strict
        return roles.filter(r => !r.is_system); // Broaden slightly if needed
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
        return grouped;
    }, [permissions]);

    const handleSeed = async () => {
        try {
            setIsSeeding(true);
            // We need an ID, but the seed function in action currently takes orgId but doesn't strictly use it for global permissions
            // Assuming global permissions for now as per schema
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Matriz de Permisos</h2>
                    <p className="text-sm text-muted-foreground">
                        Configura los accesos para cada rol personalizado de la organización.
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
                <div className="p-12 text-center border rounded-lg bg-muted/10 dashed border-2 border-dashed">
                    <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No hay permisos definidos</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto mb-6">
                        La base de datos de permisos está vacía. Genera los permisos predeterminados para comenzar a configurar tu organización.
                    </p>
                    <Button onClick={handleSeed} disabled={isSeeding}>
                        {isSeeding ? "Generando..." : "Generar Permisos del Sistema"}
                    </Button>
                </div>
            ) : !hasRoles ? (
                <div className="p-8 text-center border rounded-lg bg-muted/20">
                    <Info className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No se encontraron roles personalizados</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                        Crea un rol personalizado (ej. "Manager") para ver la matriz de permisos.
                    </p>
                </div>
            ) : (
                <Card className="border shadow-sm overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b bg-muted/30">
                                    <TableHead className="w-[300px] min-w-[200px]">Permiso</TableHead>
                                    {filteredRoles.map(role => (
                                        <TableHead key={role.id} className="text-center min-w-[120px] pb-4 pt-4">
                                            <div className="flex flex-col items-center justify-center">
                                                <Badge variant="outline" className="mb-1 bg-background">
                                                    {role.name}
                                                </Badge>
                                                {role.description && (
                                                    <span className="text-[10px] text-muted-foreground font-normal line-clamp-1 max-w-[120px]">
                                                        {role.description}
                                                    </span>
                                                )}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                        </Table>

                        <Accordion type="multiple" defaultValue={Object.keys(permissionsByCategory)} className="w-full">
                            {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                                <AccordionItem key={category} value={category} className="border-b-0">
                                    <div className="border-b bg-muted/5">
                                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/10">
                                            <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center">
                                                {category}
                                                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px]">
                                                    {categoryPermissions.length}
                                                </Badge>
                                            </span>
                                        </AccordionTrigger>
                                    </div>
                                    <AccordionContent className="p-0">
                                        <Table>
                                            <TableBody>
                                                {categoryPermissions.map(permission => (
                                                    <TableRow key={permission.id} className="hover:bg-muted/5 border-b border-border/5">
                                                        <TableCell className="w-[300px] min-w-[200px] py-4 pl-6 align-top">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-medium text-sm">{permission.description}</span>
                                                                <span className="text-[11px] text-muted-foreground font-mono bg-muted/30 w-fit px-1.5 rounded">
                                                                    {permission.key}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        {filteredRoles.map(role => {
                                                            const hasPermission = rolePermissions.some(rp => rp.role_id === role.id && rp.permission_id === permission.id);
                                                            return (
                                                                <TableCell key={`${role.id}-${permission.id}`} className="text-center p-0 align-middle">
                                                                    <div className="flex items-center justify-center h-full w-full">
                                                                        <Checkbox
                                                                            checked={hasPermission}
                                                                            disabled
                                                                            className="h-5 w-5 border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 rounded-sm"
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                            );
                                                        })}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </Card>
            )}
        </div>
    );
}
