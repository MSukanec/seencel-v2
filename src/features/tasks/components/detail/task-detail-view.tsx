"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Package,
    Plus,
    Trash2,
    Ruler,
    Monitor,
    Search,
    X
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { addTaskMaterial, updateTaskMaterial, removeTaskMaterial } from "../../actions";
import type { TaskView, TaskDivision, Unit, TaskMaterial } from "../../types";

interface AvailableMaterial {
    id: string;
    name: string;
    unit_name: string | null;
}

interface TaskDetailViewProps {
    task: TaskView;
    taskMaterials: TaskMaterial[];
    availableMaterials: AvailableMaterial[];
    units: Unit[];
    divisions: TaskDivision[];
    isAdminMode?: boolean;
}

export function TaskDetailView({
    task,
    taskMaterials,
    availableMaterials,
    units,
    divisions,
    isAdminMode = false
}: TaskDetailViewProps) {
    const router = useRouter();
    const [materials, setMaterials] = useState(taskMaterials);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
    const [amount, setAmount] = useState("1");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter available materials that are not already added
    const addedMaterialIds = new Set(materials.map(m => m.material_id));
    const filteredAvailableMaterials = availableMaterials
        .filter(m => !addedMaterialIds.has(m.id))
        .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleAddMaterial = async () => {
        if (!selectedMaterialId) return;

        setIsSubmitting(true);
        try {
            const result = await addTaskMaterial(
                task.id,
                selectedMaterialId,
                parseFloat(amount) || 1,
                isAdminMode
            );

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Material agregado");
                // Optimistic update
                const addedMaterial = availableMaterials.find(m => m.id === selectedMaterialId);
                if (addedMaterial && result.data) {
                    setMaterials([...materials, {
                        id: result.data.id,
                        task_id: task.id,
                        material_id: selectedMaterialId,
                        material_name: addedMaterial.name,
                        unit_name: addedMaterial.unit_name,
                        amount: parseFloat(amount) || 1,
                        is_system: isAdminMode
                    }]);
                }
                setIsAddModalOpen(false);
                setSelectedMaterialId(null);
                setAmount("1");
                setSearchQuery("");
                router.refresh();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateAmount = async (materialId: string, newAmount: number) => {
        const material = materials.find(m => m.id === materialId);
        if (!material) return;

        // Optimistic update
        setMaterials(materials.map(m =>
            m.id === materialId ? { ...m, amount: newAmount } : m
        ));

        const result = await updateTaskMaterial(materialId, newAmount, isAdminMode);
        if (result.error) {
            toast.error(result.error);
            // Revert
            setMaterials(materials);
        }
    };

    const handleRemoveMaterial = async (materialId: string) => {
        // Optimistic update
        const previousMaterials = materials;
        setMaterials(materials.filter(m => m.id !== materialId));

        const result = await removeTaskMaterial(materialId, isAdminMode);
        if (result.error) {
            toast.error(result.error);
            setMaterials(previousMaterials);
        } else {
            toast.success("Material eliminado");
            router.refresh();
        }
    };

    return (
        <div className="space-y-6">
            {/* Task Info Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Información de la Tarea</CardTitle>
                            <CardDescription>Datos generales de la tarea</CardDescription>
                        </div>
                        <Badge variant="system" className="gap-1">
                            <Monitor className="h-3 w-3" />
                            Sistema
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Código</p>
                            <p className="font-medium">{task.code || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Nombre</p>
                            <p className="font-medium">{task.name || task.custom_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Unidad</p>
                            <p className="font-medium">{task.unit_name || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">División</p>
                            <p className="font-medium">{task.division_name || "Sin división"}</p>
                        </div>
                        {task.description && (
                            <div className="col-span-4">
                                <p className="text-sm text-muted-foreground">Descripción</p>
                                <p className="font-medium">{task.description}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Materials Recipe Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Receta de Materiales
                            </CardTitle>
                            <CardDescription>
                                Materiales necesarios por unidad de esta tarea
                            </CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Material
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {materials.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">Sin materiales asignados</p>
                            <p className="text-sm">Agregá materiales para definir la receta de esta tarea</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                                <div className="col-span-5">Material</div>
                                <div className="col-span-2">Unidad</div>
                                <div className="col-span-3">Cantidad</div>
                                <div className="col-span-2"></div>
                            </div>

                            {/* Rows */}
                            <div className="divide-y">
                                {materials.map((material) => (
                                    <div key={material.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-muted/30">
                                        <div className="col-span-5">
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
                                                        handleUpdateAmount(material.id, newAmount);
                                                    }
                                                }}
                                                className="h-8 w-24"
                                                min="0.001"
                                                step="0.001"
                                            />
                                        </div>
                                        <div className="col-span-2 flex justify-end">
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
                </CardContent>
            </Card>

            {/* Add Material Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agregar Material a la Receta</DialogTitle>
                        <DialogDescription>
                            Seleccioná un material y la cantidad por unidad de tarea
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar material..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Material List */}
                        <div className="border rounded-lg max-h-60 overflow-y-auto">
                            {filteredAvailableMaterials.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                    No se encontraron materiales
                                </div>
                            ) : (
                                filteredAvailableMaterials.map((material) => (
                                    <div
                                        key={material.id}
                                        className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 ${selectedMaterialId === material.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                                            }`}
                                        onClick={() => setSelectedMaterialId(material.id)}
                                    >
                                        <span className="text-sm font-medium">{material.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {material.unit_name || "—"}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Amount */}
                        {selectedMaterialId && (
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium">Cantidad:</label>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-32"
                                    min="0.001"
                                    step="0.001"
                                />
                                <span className="text-sm text-muted-foreground">
                                    por {task.unit_name || "unidad"}
                                </span>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAddMaterial}
                            disabled={!selectedMaterialId || isSubmitting}
                        >
                            {isSubmitting ? "Agregando..." : "Agregar Material"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

