"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/providers/modal-store";
import { SettingsSection } from "@/components/shared/settings-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Plus, Trash2, Ruler, HardHat } from "lucide-react";
import { toast } from "sonner";
import { updateTaskMaterial, removeTaskMaterial, updateTaskLabor, removeTaskLabor } from "@/features/tasks/actions";
import { TasksMaterialForm } from "@/features/tasks/forms/tasks-material-form";
import { TasksLaborForm } from "@/features/tasks/forms/tasks-labor-form";
import type { TaskView, TaskMaterial } from "@/features/tasks/types";
import type { TaskLabor } from "@/features/tasks/queries";

// ============================================================================
// Types
// ============================================================================

interface AvailableMaterial {
    id: string;
    name: string;
    unit_name: string | null;
}

interface AvailableLaborType {
    id: string;
    name: string;
    unit_name: string | null;
}

interface TasksDetailRecipeViewProps {
    task: TaskView;
    taskMaterials: TaskMaterial[];
    taskLabor: TaskLabor[];
    availableMaterials: AvailableMaterial[];
    availableLaborTypes: AvailableLaborType[];
    isAdminMode?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function TasksDetailRecipeView({
    task,
    taskMaterials,
    taskLabor,
    availableMaterials,
    availableLaborTypes,
    isAdminMode = false
}: TasksDetailRecipeViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const [materials, setMaterials] = useState(taskMaterials);
    const [labor, setLabor] = useState(taskLabor);

    // Filter available materials that are not already added
    const addedMaterialIds = new Set(materials.map(m => m.material_id));
    const filteredAvailableMaterials = availableMaterials.filter(
        m => !addedMaterialIds.has(m.id)
    );

    // Filter available labor types that are not already added
    const addedLaborTypeIds = new Set(labor.map(l => l.labor_type_id));
    const filteredAvailableLaborTypes = availableLaborTypes.filter(
        l => !addedLaborTypeIds.has(l.id)
    );

    // ========================================================================
    // Material Handlers
    // ========================================================================

    const handleOpenAddMaterialModal = () => {
        openModal(
            <TasksMaterialForm
                taskId={task.id}
                availableMaterials={filteredAvailableMaterials}
                isAdminMode={isAdminMode}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
                onCancel={closeModal}
            />,
            {
                title: "Agregar Material a la Receta",
                description: "Seleccioná un material y la cantidad por unidad de tarea.",
                size: "md"
            }
        );
    };

    const handleUpdateMaterialAmount = async (materialId: string, newAmount: number) => {
        // Optimistic update
        setMaterials(prev =>
            prev.map(m => m.id === materialId ? { ...m, amount: newAmount } : m)
        );

        const result = await updateTaskMaterial(materialId, newAmount, isAdminMode);
        if (result.error) {
            toast.error(result.error);
            // Revert on error
            setMaterials(taskMaterials);
        }
    };

    const handleRemoveMaterial = async (materialId: string) => {
        // Optimistic update
        const previousMaterials = [...materials];
        setMaterials(prev => prev.filter(m => m.id !== materialId));

        const result = await removeTaskMaterial(materialId, isAdminMode);
        if (result.error) {
            toast.error(result.error);
            setMaterials(previousMaterials);
        } else {
            toast.success("Material eliminado");
            router.refresh();
        }
    };

    // ========================================================================
    // Labor Handlers
    // ========================================================================

    const handleOpenAddLaborModal = () => {
        openModal(
            <TasksLaborForm
                taskId={task.id}
                availableLaborTypes={filteredAvailableLaborTypes}
                isAdminMode={isAdminMode}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
                onCancel={closeModal}
            />,
            {
                title: "Agregar Mano de Obra a la Receta",
                description: "Seleccioná un tipo de mano de obra y la cantidad por unidad de tarea.",
                size: "md"
            }
        );
    };

    const handleUpdateLaborQuantity = async (laborId: string, newQuantity: number) => {
        // Optimistic update
        setLabor(prev =>
            prev.map(l => l.id === laborId ? { ...l, quantity: newQuantity } : l)
        );

        const result = await updateTaskLabor(laborId, newQuantity, isAdminMode);
        if (result.error) {
            toast.error(result.error);
            // Revert on error
            setLabor(taskLabor);
        }
    };

    const handleRemoveLabor = async (laborId: string) => {
        // Optimistic update
        const previousLabor = [...labor];
        setLabor(prev => prev.filter(l => l.id !== laborId));

        const result = await removeTaskLabor(laborId, isAdminMode);
        if (result.error) {
            toast.error(result.error);
            setLabor(previousLabor);
        } else {
            toast.success("Mano de obra eliminada");
            router.refresh();
        }
    };

    return (
        <div className="space-y-8">
            {/* Materials Section */}
            <SettingsSection
                icon={Package}
                title="Materiales"
                description="Materiales necesarios por unidad de esta tarea"
            >
                <div className="space-y-4">
                    {/* Action button */}
                    <div className="flex justify-end">
                        <Button size="sm" onClick={handleOpenAddMaterialModal}>
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar
                        </Button>
                    </div>

                    {/* Content */}
                    {materials.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                            <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">Sin materiales asignados</p>
                            <p className="text-sm">Agregá materiales para definir la receta</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                                <div className="col-span-6">Material</div>
                                <div className="col-span-2">Unidad</div>
                                <div className="col-span-3">Cantidad</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Rows */}
                            <div className="divide-y">
                                {materials.map((material) => (
                                    <div key={material.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-muted/30">
                                        <div className="col-span-6">
                                            <p className="font-medium text-sm">{material.material_name}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <Badge variant="outline" className="text-xs">
                                                <Ruler className="h-3 w-3 mr-1" />
                                                {material.unit_name || "—"}
                                            </Badge>
                                        </div>
                                        <div className="col-span-3">
                                            <Input
                                                type="number"
                                                value={material.amount || ""}
                                                onChange={(e) => {
                                                    const newAmount = parseFloat(e.target.value);
                                                    if (!isNaN(newAmount) && newAmount > 0) {
                                                        handleUpdateMaterialAmount(material.id, newAmount);
                                                    }
                                                }}
                                                className="h-8 w-full"
                                                min="0.001"
                                                step="0.001"
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleRemoveMaterial(material.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </SettingsSection>

            {/* Labor Section */}
            <SettingsSection
                icon={HardHat}
                title="Mano de Obra"
                description="Mano de obra necesaria por unidad de esta tarea"
            >
                <div className="space-y-4">
                    {/* Action button */}
                    <div className="flex justify-end">
                        <Button size="sm" onClick={handleOpenAddLaborModal}>
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar
                        </Button>
                    </div>

                    {/* Content */}
                    {labor.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                            <HardHat className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">Sin mano de obra asignada</p>
                            <p className="text-sm">Agregá tipos de mano de obra para definir la receta</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                                <div className="col-span-6">Tipo</div>
                                <div className="col-span-2">Unidad</div>
                                <div className="col-span-3">Cantidad</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Rows */}
                            <div className="divide-y">
                                {labor.map((laborItem) => (
                                    <div key={laborItem.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-muted/30">
                                        <div className="col-span-6">
                                            <p className="font-medium text-sm">{laborItem.labor_type_name}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <Badge variant="outline" className="text-xs">
                                                <Ruler className="h-3 w-3 mr-1" />
                                                {laborItem.unit_name || "—"}
                                            </Badge>
                                        </div>
                                        <div className="col-span-3">
                                            <Input
                                                type="number"
                                                value={laborItem.quantity || ""}
                                                onChange={(e) => {
                                                    const newQuantity = parseFloat(e.target.value);
                                                    if (!isNaN(newQuantity) && newQuantity > 0) {
                                                        handleUpdateLaborQuantity(laborItem.id, newQuantity);
                                                    }
                                                }}
                                                className="h-8 w-full"
                                                min="0.01"
                                                step="0.01"
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleRemoveLabor(laborItem.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </SettingsSection>
        </div>
    );
}

