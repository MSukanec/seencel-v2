"use client";

import { useState, useMemo, useCallback } from "react";
import { TaskTemplate, TaskParameter, TaskTemplateParameter, TaskAction, TaskElement, TaskConstructionSystem, TaskDivision, Unit } from "@/features/tasks/types";
import { TasksTemplateForm } from "../forms/tasks-template-form";
import { deleteTaskTemplate, toggleTemplateParameter, reorderTemplateParameters } from "../actions";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LayoutTemplate, ChevronDown, ChevronRight, Settings2, GripVertical, X, ChevronsUpDown, Check } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

// DnD-Kit
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ============================================================================
// Types
// ============================================================================

interface TasksTemplatesViewProps {
    templates: TaskTemplate[];
    parameters: TaskParameter[];
    templateParameterLinks: TaskTemplateParameter[];
    actions: TaskAction[];
    elements: TaskElement[];
    systems: TaskConstructionSystem[];
    divisions: TaskDivision[];
    units: Unit[];
}

interface LinkedParam {
    parameterId: string;
    label: string;
    optionCount: number;
    isRequired: boolean;
    order: number;
}

// ============================================================================
// Status badge helper
// ============================================================================

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
        active: { label: "Activo", variant: "default" },
        draft: { label: "Borrador", variant: "secondary" },
        archived: { label: "Archivado", variant: "outline" },
    };
    const cfg = map[status] ?? { label: status, variant: "outline" };
    return <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>;
}

// ============================================================================
// Sortable row component
// ============================================================================

function SortableParamRow({
    param,
    onRemove,
}: {
    param: LinkedParam;
    onRemove: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: param.parameterId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-2 p-2 rounded-md border bg-card",
                isDragging && "shadow-lg border-primary/50"
            )}
        >
            {/* Drag handle */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-0.5 touch-none"
                title="Arrastrar para reordenar"
            >
                <GripVertical className="h-4 w-4" />
            </button>

            {/* Badge with order number */}
            <span className="text-xs font-mono text-muted-foreground w-5 text-center shrink-0">
                {param.order + 1}
            </span>

            {/* Label */}
            <span className="text-sm flex-1 min-w-0 truncate">{param.label}</span>

            {/* Option count */}
            {param.optionCount > 0 && (
                <span className="text-xs text-muted-foreground shrink-0">
                    {param.optionCount} opc.
                </span>
            )}

            {/* Remove */}
            <button
                onClick={() => onRemove(param.parameterId)}
                className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                title="Quitar parámetro"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

// ============================================================================
// Template Parameters Panel (per-template)
// ============================================================================

function TemplateParametersPanel({
    template,
    allParameters,
    templateParameterLinks,
}: {
    template: TaskTemplate;
    allParameters: TaskParameter[];
    templateParameterLinks: TaskTemplateParameter[];
}) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Build initial linked params with order from DB
    const linksForTemplate = useMemo(
        () => templateParameterLinks.filter((l) => l.template_id === template.id),
        [templateParameterLinks, template.id]
    );

    const [linkedParams, setLinkedParams] = useState<LinkedParam[]>(() => {
        return linksForTemplate
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((link, idx) => {
                const param = allParameters.find((p) => p.id === link.parameter_id);
                return {
                    parameterId: link.parameter_id,
                    label: param?.label ?? link.parameter_id,
                    optionCount: param?.options?.length ?? 0,
                    isRequired: link.is_required ?? true,
                    order: idx,
                };
            });
    });

    const [comboOpen, setComboOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Parameters not yet linked
    const linkedIds = useMemo(() => new Set(linkedParams.map((p) => p.parameterId)), [linkedParams]);
    const availableParams = useMemo(
        () => allParameters.filter((p) => !linkedIds.has(p.id)).sort((a, b) => a.label.localeCompare(b.label)),
        [allParameters, linkedIds]
    );

    // ── Add parameter ──
    const handleAdd = useCallback(async (param: TaskParameter) => {
        const newOrder = linkedParams.length;
        const newLinked: LinkedParam = {
            parameterId: param.id,
            label: param.label,
            optionCount: param.options?.length ?? 0,
            isRequired: true,
            order: newOrder,
        };

        setLinkedParams((prev) => [...prev, newLinked]);
        setComboOpen(false);

        const result = await toggleTemplateParameter(template.id, param.id, true, newOrder);
        if (result.error) {
            toast.error(result.error);
            setLinkedParams((prev) => prev.filter((p) => p.parameterId !== param.id));
        }
    }, [template.id, linkedParams.length]);

    // ── Remove parameter ──
    const handleRemove = useCallback(async (parameterId: string) => {
        const prev = linkedParams;
        setLinkedParams((p) => p.filter((x) => x.parameterId !== parameterId).map((x, i) => ({ ...x, order: i })));

        const result = await toggleTemplateParameter(template.id, parameterId, false);
        if (result.error) {
            toast.error(result.error);
            setLinkedParams(prev);
        }
    }, [template.id, linkedParams]);

    // ── Drag end ──
    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = linkedParams.findIndex((p) => p.parameterId === active.id);
        const newIndex = linkedParams.findIndex((p) => p.parameterId === over.id);
        const reordered = arrayMove(linkedParams, oldIndex, newIndex).map((p, i) => ({ ...p, order: i }));

        setLinkedParams(reordered);
        setIsSaving(true);

        const result = await reorderTemplateParameters(
            template.id,
            reordered.map((p) => ({ parameterId: p.parameterId, isRequired: p.isRequired }))
        );
        setIsSaving(false);
        if (result.error) toast.error(result.error);
    }, [template.id, linkedParams]);

    return (
        <div className="border-t p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Parámetros</span>
                    <Badge variant="outline" className="text-xs">{linkedParams.length}</Badge>
                    {isSaving && <span className="text-xs text-muted-foreground animate-pulse">Guardando orden...</span>}
                </div>

                {/* Combobox to add a parameter */}
                <Popover open={comboOpen} onOpenChange={setComboOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <Plus className="h-3.5 w-3.5" />
                            Agregar
                            <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" align="end">
                        <Command>
                            <CommandInput placeholder="Buscar parámetro..." />
                            <CommandList>
                                <CommandEmpty>No hay más parámetros disponibles.</CommandEmpty>
                                <CommandGroup>
                                    {availableParams.map((param) => (
                                        <CommandItem
                                            key={param.id}
                                            value={param.label}
                                            onSelect={() => handleAdd(param)}
                                            className="flex items-center justify-between"
                                        >
                                            <span>{param.label}</span>
                                            {(param.options?.length ?? 0) > 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    {param.options?.length} opc.
                                                </span>
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Drag-drop list */}
            {linkedParams.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                    Sin parámetros. Usá el botón &ldquo;Agregar&rdquo; para seleccionar.
                </p>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={linkedParams.map((p) => p.parameterId)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-1.5">
                            {linkedParams.map((param) => (
                                <SortableParamRow
                                    key={param.parameterId}
                                    param={param}
                                    onRemove={handleRemove}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {linkedParams.length > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <GripVertical className="h-3 w-3" />
                    Arrastrá las filas para cambiar el orden en que el usuario completará los parámetros.
                </p>
            )}
        </div>
    );
}

// ============================================================================
// Main component
// ============================================================================

export function TasksTemplatesView({
    templates,
    parameters,
    templateParameterLinks,
    actions,
    elements,
    systems,
    divisions,
    units,
}: TasksTemplatesViewProps) {
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<TaskTemplate | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());

    // Count per template (for header badge)
    const paramCountByTemplate = useMemo(() => {
        const map: Record<string, number> = {};
        templateParameterLinks.forEach((link) => {
            map[link.template_id] = (map[link.template_id] ?? 0) + 1;
        });
        return map;
    }, [templateParameterLinks]);

    const filteredTemplates = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return templates
            .filter((t) =>
                !q ||
                t.name.toLowerCase().includes(q) ||
                (t.action_name ?? "").toLowerCase().includes(q) ||
                (t.element_name ?? "").toLowerCase().includes(q) ||
                (t.system_name ?? "").toLowerCase().includes(q)
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [templates, searchQuery]);

    const toggleExpand = (id: string) => {
        setExpandedTemplates((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleCreate = () => {
        openModal(
            <TasksTemplateForm />,
            { title: "Nueva Plantilla de Tarea", description: "Definí la estructura base de una tarea parametrizada.", size: "md" }
        );
    };

    const handleEdit = (template: TaskTemplate) => {
        openModal(
            <TasksTemplateForm initialData={template} />,
            { title: "Editar Plantilla", description: `Modificando "${template.name}"`, size: "md" }
        );
    };

    const handleDeleteClick = (template: TaskTemplate) => {
        setItemToDelete(template);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        const result = await deleteTaskTemplate(itemToDelete.id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Plantilla eliminada");
        }
        setIsDeleting(false);
        setDeleteModalOpen(false);
        setItemToDelete(null);
    };

    return (
        <>
            {/* Toolbar */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar plantillas..."
                actions={[{ label: "Nueva Plantilla", icon: Plus, onClick: handleCreate }]}
            />

            {/* Content */}
            {filteredTemplates.length === 0 ? (
                searchQuery ? (
                    <ViewEmptyState
                        mode="no-results"
                        icon={LayoutTemplate}
                        viewName="plantillas"
                        filterContext="con ese criterio de búsqueda"
                        onResetFilters={() => setSearchQuery("")}
                    />
                ) : (
                    <ViewEmptyState
                        mode="empty"
                        icon={LayoutTemplate}
                        viewName="Plantillas de Tareas"
                        featureDescription="Las plantillas definen la estructura fija de una tarea parametrizada: acción, elemento, sistema constructivo y qué parámetros están disponibles. Los usuarios seleccionan una plantilla al crear una nueva tarea."
                        onAction={handleCreate}
                        actionLabel="Nueva Plantilla"
                    />
                )
            ) : (
                <div className="space-y-3">
                    {filteredTemplates.map((template) => {
                        const isExpanded = expandedTemplates.has(template.id);
                        const paramCount = paramCountByTemplate[template.id] ?? 0;

                        return (
                            <Card key={template.id} className="overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 bg-muted/30">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => toggleExpand(template.id)}
                                        >
                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </Button>

                                        <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                                            <LayoutTemplate className="h-4 w-4" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-medium">{template.name}</h3>
                                                <StatusBadge status={template.status} />
                                                {template.code && (
                                                    <Badge variant="outline" className="text-xs font-mono">
                                                        {template.code}
                                                    </Badge>
                                                )}
                                                {template.element_name && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {template.element_name}
                                                    </Badge>
                                                )}
                                                {template.system_name && (
                                                    <span className="text-xs text-muted-foreground">· {template.system_name}</span>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {paramCount} parámetro{paramCount !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                            {template.description && (
                                                <p className="text-sm text-muted-foreground mt-0.5 truncate">{template.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-1 shrink-0">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(template)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteClick(template)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Parameters panel (collapsible) */}
                                {isExpanded && (
                                    <TemplateParametersPanel
                                        template={template}
                                        allParameters={parameters}
                                        templateParameterLinks={templateParameterLinks}
                                    />
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Plantilla</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que querés eliminar &quot;{itemToDelete?.name}&quot;?
                            Las tareas ya creadas con esta plantilla no se verán afectadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
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
