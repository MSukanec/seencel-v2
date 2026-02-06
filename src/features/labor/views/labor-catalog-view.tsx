"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { useModal } from "@/stores/modal-store";
import {
    HardHat, Plus, Pencil, Trash2, Users, Shield,
    Layers, UserCog, Briefcase, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
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
import {
    deleteSystemLaborCategory,
    deleteSystemLaborLevel,
    deleteSystemLaborRole,
    deleteSystemLaborType
} from "@/features/labor/actions";
import { SystemLaborCategoryForm } from "@/features/labor/forms/system-labor-category-form";
import { SystemLaborLevelForm } from "@/features/labor/forms/system-labor-level-form";
import { SystemLaborRoleForm } from "@/features/labor/forms/system-labor-role-form";
import { SystemLaborTypeForm } from "@/features/labor/forms/system-labor-type-form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// ============================================================================
// Types
// ============================================================================

interface LaborCategory {
    id: string;
    name: string;
    description: string | null;
    is_system: boolean;
}

interface LaborLevel {
    id: string;
    name: string;
    description: string | null;
    sort_order?: number;
    // Note: labor_levels is a global system table, no is_system column
}

interface LaborRole {
    id: string;
    name: string;
    description: string | null;
    is_system: boolean;
}

interface LaborType {
    id: string;
    name: string;
    description: string | null;
    labor_category_id: string;
    labor_level_id: string;
    labor_role_id: string | null;
    unit_id: string;
    category_name: string | null;
    level_name: string | null;
    role_name: string | null;
    unit_name: string | null;
    // Note: labor_types is a global system table, no is_system column
}

interface Unit {
    id: string;
    name: string;
}

interface LaborCatalogViewProps {
    laborCategories: LaborCategory[];
    laborLevels: LaborLevel[];
    laborRoles: LaborRole[];
    laborTypes: LaborType[];
    units: Unit[];
    isAdminMode?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function LaborCatalogView({
    laborCategories,
    laborLevels,
    laborRoles,
    laborTypes,
    units,
    isAdminMode = false
}: LaborCatalogViewProps) {
    // State
    const { openModal, closeModal } = useModal();
    const [categories, setCategories] = useState(laborCategories);
    const [levels, setLevels] = useState(laborLevels);
    const [roles, setRoles] = useState(laborRoles);
    const [types, setTypes] = useState(laborTypes);
    const [searchQuery, setSearchQuery] = useState("");

    // Collapsible states
    const [openSections, setOpenSections] = useState({
        categories: true,
        levels: true,
        roles: true,
        types: true
    });

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<{
        type: 'category' | 'level' | 'role' | 'laborType';
        id: string;
        name: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ===== Filter by search =====
    const filterBySearch = <T extends { name: string; description: string | null }>(items: T[]) => {
        if (!searchQuery) return items;
        const q = searchQuery.toLowerCase();
        return items.filter(item =>
            item.name.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q))
        );
    };

    const filteredCategories = filterBySearch(categories);
    const filteredLevels = filterBySearch(levels);
    const filteredRoles = filterBySearch(roles);
    const filteredTypes = filterBySearch(types);

    // ===== Handlers =====

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Categories
    const handleCreateCategory = () => {
        openModal(
            <SystemLaborCategoryForm
                onSuccess={(newItem: LaborCategory) => {
                    setCategories(prev => [...prev, newItem]);
                    closeModal();
                    toast.success("Oficio creado");
                }}
                onCancel={closeModal}
            />,
            { title: "Nuevo Oficio", description: "Define un nuevo oficio para el catálogo.", size: "md" }
        );
    };

    const handleEditCategory = (item: LaborCategory) => {
        openModal(
            <SystemLaborCategoryForm
                initialData={item}
                onSuccess={(updated: LaborCategory) => {
                    setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
                    closeModal();
                    toast.success("Oficio actualizado");
                }}
                onCancel={closeModal}
            />,
            { title: "Editar Oficio", description: `Modificar "${item.name}"`, size: "md" }
        );
    };

    // Levels
    const handleCreateLevel = () => {
        openModal(
            <SystemLaborLevelForm
                onSuccess={(newItem: LaborLevel) => {
                    setLevels(prev => [...prev, newItem]);
                    closeModal();
                    toast.success("Nivel creado");
                }}
                onCancel={closeModal}
            />,
            { title: "Nuevo Nivel", description: "Define un nuevo nivel de calificación.", size: "md" }
        );
    };

    const handleEditLevel = (item: LaborLevel) => {
        openModal(
            <SystemLaborLevelForm
                initialData={item}
                onSuccess={(updated: LaborLevel) => {
                    setLevels(prev => prev.map(l => l.id === updated.id ? updated : l));
                    closeModal();
                    toast.success("Nivel actualizado");
                }}
                onCancel={closeModal}
            />,
            { title: "Editar Nivel", description: `Modificar "${item.name}"`, size: "md" }
        );
    };

    // Roles
    const handleCreateRole = () => {
        openModal(
            <SystemLaborRoleForm
                onSuccess={(newItem: LaborRole) => {
                    setRoles(prev => [...prev, newItem]);
                    closeModal();
                    toast.success("Rol creado");
                }}
                onCancel={closeModal}
            />,
            { title: "Nuevo Rol", description: "Define un nuevo rol funcional.", size: "md" }
        );
    };

    const handleEditRole = (item: LaborRole) => {
        openModal(
            <SystemLaborRoleForm
                initialData={item}
                onSuccess={(updated: LaborRole) => {
                    setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
                    closeModal();
                    toast.success("Rol actualizado");
                }}
                onCancel={closeModal}
            />,
            { title: "Editar Rol", description: `Modificar "${item.name}"`, size: "md" }
        );
    };

    // Labor Types
    const handleCreateType = () => {
        openModal(
            <SystemLaborTypeForm
                categories={categories}
                levels={levels}
                roles={roles}
                units={units}
                onSuccess={(newItem: LaborType) => {
                    setTypes(prev => [...prev, newItem]);
                    closeModal();
                    toast.success("Tipo creado");
                }}
                onCancel={closeModal}
            />,
            { title: "Nuevo Tipo de Mano de Obra", description: "Combina oficio + nivel + rol para crear un tipo usable.", size: "lg" }
        );
    };

    const handleEditType = (item: LaborType) => {
        openModal(
            <SystemLaborTypeForm
                initialData={item}
                categories={categories}
                levels={levels}
                roles={roles}
                units={units}
                onSuccess={(updated: LaborType) => {
                    setTypes(prev => prev.map(t => t.id === updated.id ? updated : t));
                    closeModal();
                    toast.success("Tipo actualizado");
                }}
                onCancel={closeModal}
            />,
            { title: "Editar Tipo", description: `Modificar "${item.name}"`, size: "lg" }
        );
    };

    // Delete
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        let result;

        switch (deleteTarget.type) {
            case 'category':
                result = await deleteSystemLaborCategory(deleteTarget.id);
                if (result.success) setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
                break;
            case 'level':
                result = await deleteSystemLaborLevel(deleteTarget.id);
                if (result.success) setLevels(prev => prev.filter(l => l.id !== deleteTarget.id));
                break;
            case 'role':
                result = await deleteSystemLaborRole(deleteTarget.id);
                if (result.success) setRoles(prev => prev.filter(r => r.id !== deleteTarget.id));
                break;
            case 'laborType':
                result = await deleteSystemLaborType(deleteTarget.id);
                if (result.success) setTypes(prev => prev.filter(t => t.id !== deleteTarget.id));
                break;
        }

        if (result?.success) {
            toast.success("Eliminado correctamente");
        } else {
            toast.error(result?.error || "Error al eliminar");
        }

        setDeleteTarget(null);
        setIsDeleting(false);
    };

    // ===== Render =====

    const isEmpty = categories.length === 0 && levels.length === 0 && roles.length === 0 && types.length === 0;

    if (isEmpty && !searchQuery) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={[
                        { label: "Nuevo Tipo", icon: Plus, onClick: handleCreateType }
                    ]}
                />
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={HardHat}
                        viewName="Catálogo de Mano de Obra"
                        featureDescription="Comenzá creando oficios, niveles, roles y tipos."
                        onAction={handleCreateType}
                        actionLabel="Nuevo Tipo"
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar..."
                actions={[
                    { label: "Nuevo Tipo", icon: Plus, onClick: handleCreateType }
                ]}
            />

            <div className="space-y-4 p-4 overflow-y-auto h-full">
                {/* OFICIOS */}
                <CollapsibleSection
                    title="Oficios"
                    icon={Briefcase}
                    count={filteredCategories.length}
                    isOpen={openSections.categories}
                    onToggle={() => toggleSection('categories')}
                    description="Albañilería, Electricidad, Pintura, etc."
                    onAdd={handleCreateCategory}
                >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredCategories.map((item) => (
                            <SimpleCard
                                key={item.id}
                                name={item.name}
                                description={item.description}
                                isSystem={item.is_system}
                                onEdit={() => handleEditCategory(item)}
                                onDelete={() => setDeleteTarget({ type: 'category', id: item.id, name: item.name })}
                            />
                        ))}
                    </div>
                </CollapsibleSection>

                {/* NIVELES */}
                <CollapsibleSection
                    title="Niveles"
                    icon={Layers}
                    count={filteredLevels.length}
                    isOpen={openSections.levels}
                    onToggle={() => toggleSection('levels')}
                    description="Ayudante, Oficial, Capataz, etc."
                    onAdd={handleCreateLevel}
                >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredLevels.map((item) => (
                            <SimpleCard
                                key={item.id}
                                name={item.name}
                                description={item.description}
                                isSystem={true}
                                onEdit={() => handleEditLevel(item)}
                                onDelete={() => setDeleteTarget({ type: 'level', id: item.id, name: item.name })}
                            />
                        ))}
                    </div>
                </CollapsibleSection>

                {/* ROLES */}
                <CollapsibleSection
                    title="Roles"
                    icon={UserCog}
                    count={filteredRoles.length}
                    isOpen={openSections.roles}
                    onToggle={() => toggleSection('roles')}
                    description="Producción, Supervisión, Dirección"
                    onAdd={handleCreateRole}
                >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredRoles.map((item) => (
                            <SimpleCard
                                key={item.id}
                                name={item.name}
                                description={item.description}
                                isSystem={item.is_system}
                                onEdit={() => handleEditRole(item)}
                                onDelete={() => setDeleteTarget({ type: 'role', id: item.id, name: item.name })}
                            />
                        ))}
                    </div>
                </CollapsibleSection>

                {/* TIPOS USABLES */}
                <CollapsibleSection
                    title="Tipos de Mano de Obra"
                    icon={Users}
                    count={filteredTypes.length}
                    isOpen={openSections.types}
                    onToggle={() => toggleSection('types')}
                    description="Combinación usable: oficio + nivel + rol"
                    onAdd={handleCreateType}
                >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredTypes.map((item) => (
                            <LaborTypeCard
                                key={item.id}
                                laborType={item}
                                onEdit={() => handleEditType(item)}
                                onDelete={() => setDeleteTarget({ type: 'laborType', id: item.id, name: item.name })}
                            />
                        ))}
                    </div>
                </CollapsibleSection>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de eliminar &quot;{deleteTarget?.name}&quot;? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ============================================================================
// Collapsible Section
// ============================================================================

interface CollapsibleSectionProps {
    title: string;
    icon: React.ElementType;
    count: number;
    isOpen: boolean;
    onToggle: () => void;
    description: string;
    onAdd: () => void;
    children: React.ReactNode;
}

function CollapsibleSection({ title, icon: Icon, count, isOpen, onToggle, description, onAdd, children }: CollapsibleSectionProps) {
    return (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
            <Card>
                <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{title}</h3>
                                    <Badge variant="secondary" className="text-xs">{count}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Agregar
                            </Button>
                            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="px-4 pb-4">
                        {children}
                    </div>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

// ============================================================================
// Simple Card (for Categories, Levels, Roles)
// ============================================================================

interface SimpleCardProps {
    name: string;
    description: string | null;
    isSystem: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

function SimpleCard({ name, description, isSystem, onEdit, onDelete }: SimpleCardProps) {
    return (
        <Card className="group hover:border-primary/50 transition-colors">
            <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{name}</span>
                            {isSystem && (
                                <Badge variant="outline" className="shrink-0 text-xs gap-1">
                                    <Shield className="h-3 w-3" />
                                    Sistema
                                </Badge>
                            )}
                        </div>
                        {description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
                        )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Labor Type Card (with additional info)
// ============================================================================

interface LaborTypeCardProps {
    laborType: LaborType;
    onEdit: () => void;
    onDelete: () => void;
}

function LaborTypeCard({ laborType, onEdit, onDelete }: LaborTypeCardProps) {
    return (
        <Card className="group hover:border-primary/50 transition-colors">
            <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <HardHat className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">{laborType.name}</span>
                            {/* labor_types is global system table - always show Sistema badge */}
                            <Badge variant="outline" className="shrink-0 text-xs gap-1">
                                <Shield className="h-3 w-3" />
                                Sistema
                            </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5 ml-6">
                            <div className="flex gap-2">
                                <span className="text-muted-foreground/70">Oficio:</span>
                                <span>{laborType.category_name || '-'}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-muted-foreground/70">Nivel:</span>
                                <span>{laborType.level_name || '-'}</span>
                            </div>
                            {laborType.role_name && (
                                <div className="flex gap-2">
                                    <span className="text-muted-foreground/70">Rol:</span>
                                    <span>{laborType.role_name}</span>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <span className="text-muted-foreground/70">Unidad:</span>
                                <Badge variant="secondary" className="text-xs">{laborType.unit_name || '-'}</Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
