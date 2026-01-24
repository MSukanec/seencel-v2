"use client";

import { useState } from "react";
import { Check, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MaterialRequirement, PurchaseOrderItemFormData } from "../../types";

interface RequirementsSelectorProps {
    requirements: MaterialRequirement[];
    onSelect: (items: PurchaseOrderItemFormData[]) => void;
    onClose: () => void;
}

export function RequirementsSelector({
    requirements,
    onSelect,
    onClose,
}: RequirementsSelectorProps) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Record<string, { quantity: number; checked: boolean }>>({});

    // Initialize with defaults
    const filteredRequirements = requirements.filter((req) =>
        req.material_name.toLowerCase().includes(search.toLowerCase()) ||
        (req.category_name?.toLowerCase() || "").includes(search.toLowerCase())
    );

    const handleToggle = (req: MaterialRequirement) => {
        setSelected((prev) => ({
            ...prev,
            [req.material_id]: {
                quantity: prev[req.material_id]?.quantity ?? req.total_required,
                checked: !prev[req.material_id]?.checked,
            },
        }));
    };

    const handleQuantityChange = (materialId: string, quantity: number) => {
        setSelected((prev) => ({
            ...prev,
            [materialId]: {
                ...prev[materialId],
                quantity,
                checked: true,
            },
        }));
    };

    const handleConfirm = () => {
        const items: PurchaseOrderItemFormData[] = Object.entries(selected)
            .filter(([_, value]) => value.checked)
            .map(([materialId, value]) => {
                const req = requirements.find((r) => r.material_id === materialId)!;
                return {
                    material_id: materialId,
                    description: req.material_name,
                    quantity: value.quantity,
                    unit_id: null, // Could be enhanced to include unit_id from req
                    unit_price: null,
                    notes: null,
                };
            });

        onSelect(items);
        onClose();
    };

    const selectedCount = Object.values(selected).filter((s) => s.checked).length;

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Search */}
            <div className="mb-4">
                <Input
                    placeholder="Buscar material..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Requirements List */}
            <ScrollArea className="flex-1 min-h-0 border rounded-md">
                <div className="p-2 space-y-1">
                    {filteredRequirements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Package className="h-8 w-8 mb-2" />
                            <p className="text-sm">No hay necesidades pendientes</p>
                        </div>
                    ) : (
                        filteredRequirements.map((req) => {
                            const isSelected = selected[req.material_id]?.checked || false;
                            const quantity = selected[req.material_id]?.quantity ?? req.total_required;

                            return (
                                <div
                                    key={req.material_id}
                                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                                        }`}
                                    onClick={() => handleToggle(req)}
                                >
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => handleToggle(req)}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">
                                            {req.material_name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {req.category_name || "Sin categoría"} • {req.task_count} tarea(s)
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={quantity}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handleQuantityChange(req.material_id, parseFloat(e.target.value) || 0)}
                                            className="w-20 h-8 text-sm text-right"
                                        />
                                        <span className="text-sm text-muted-foreground w-16 truncate">
                                            {req.unit_name || "und"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
                <span className="text-sm text-muted-foreground">
                    {selectedCount} material(es) seleccionado(s)
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={selectedCount === 0}>
                        <Check className="mr-2 h-4 w-4" />
                        Agregar a la Orden
                    </Button>
                </div>
            </div>
        </div>
    );
}
