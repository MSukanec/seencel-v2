import { useState } from "react";
import { FKConflict, ResolutionMap } from "@/lib/import-conflict-utils";
import { ImportConfig, ForeignKeyOption } from "@/lib/import-utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Plus, ArrowRight, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImportStepConflictsProps {
    config: ImportConfig;
    conflicts: FKConflict[];
    organizationId: string;
    onResolutionsChange: (resolutions: ResolutionMap, allResolved: boolean) => void;
}

type ResolutionAction = 'create' | 'map' | 'ignore' | null;

interface ValueResolution {
    action: ResolutionAction;
    targetId?: string;
}

export function ImportStepConflicts({
    config,
    conflicts,
    organizationId,
    onResolutionsChange
}: ImportStepConflictsProps) {
    // State: field -> value -> resolution
    const [resolutions, setResolutions] = useState<Record<string, Record<string, ValueResolution>>>({});
    const [creatingValues, setCreatingValues] = useState<Set<string>>(new Set());

    // Count total missing values and resolved values
    const totalMissing = conflicts.reduce((acc, c) => acc + c.missingValues.length, 0);
    const resolvedCount = Object.values(resolutions).reduce((acc, fieldRes) => {
        return acc + Object.values(fieldRes).filter(r => r.action !== null).length;
    }, 0);

    const handleResolutionChange = (
        field: string,
        value: string,
        action: ResolutionAction,
        targetId?: string
    ) => {
        const newResolutions = {
            ...resolutions,
            [field]: {
                ...resolutions[field],
                [value]: { action, targetId }
            }
        };
        setResolutions(newResolutions);

        // Build ResolutionMap for parent
        const resolutionMap: ResolutionMap = {};
        for (const [fieldKey, fieldValues] of Object.entries(newResolutions)) {
            resolutionMap[fieldKey] = {};
            for (const [valueKey, res] of Object.entries(fieldValues)) {
                if (res.action === 'map' && res.targetId) {
                    resolutionMap[fieldKey][valueKey] = res.targetId;
                } else if (res.action === 'ignore') {
                    resolutionMap[fieldKey][valueKey] = null;
                } else if (res.action === 'create' && res.targetId) {
                    resolutionMap[fieldKey][valueKey] = res.targetId;
                }
            }
        }

        // Check if all resolved
        const allResolved = resolvedCount + 1 >= totalMissing;
        onResolutionsChange(resolutionMap, allResolved);
    };

    const handleCreate = async (conflict: FKConflict, value: string) => {
        const column = config.columns.find(c => String(c.id) === conflict.field);
        if (!column?.foreignKey?.createAction) return;

        const key = `${conflict.field}:${value}`;
        setCreatingValues(prev => new Set(prev).add(key));

        try {
            const result = await column.foreignKey.createAction(organizationId, value);
            handleResolutionChange(conflict.field, value, 'create', result.id);
        } catch (error) {
            console.error('Failed to create:', error);
        } finally {
            setCreatingValues(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    };

    if (conflicts.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full py-12 text-center"
            >
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold">¡Sin Conflictos!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Todos los valores están listos para importar.
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
        >
            {/* Summary Bar */}
            <div className="p-6 pb-2">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="text-lg font-semibold text-amber-700">
                            {totalMissing} valor{totalMissing > 1 ? 'es' : ''} no encontrado{totalMissing > 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-amber-600/80">
                            Resuelve los conflictos antes de continuar
                        </div>
                    </div>
                    <Badge variant={resolvedCount === totalMissing ? "default" : "secondary"}>
                        {resolvedCount} / {totalMissing} resueltos
                    </Badge>
                </div>
            </div>

            {/* Conflict List */}
            <div className="flex-1 p-6 pt-2 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="space-y-6">
                        {conflicts.map((conflict) => (
                            <div key={conflict.field} className="border rounded-lg overflow-hidden">
                                <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
                                    <div className="font-medium text-sm">{conflict.fieldLabel}</div>
                                    <Badge variant="outline" className="text-xs">
                                        {conflict.missingValues.length} faltante{conflict.missingValues.length > 1 ? 's' : ''}
                                    </Badge>
                                </div>
                                <div className="divide-y">
                                    {conflict.missingValues.map((value) => {
                                        const resolution = resolutions[conflict.field]?.[value];
                                        const isCreating = creatingValues.has(`${conflict.field}:${value}`);

                                        return (
                                            <div
                                                key={value}
                                                className={cn(
                                                    "px-4 py-3 flex items-center gap-4",
                                                    resolution?.action && "bg-green-50/50 dark:bg-green-950/10"
                                                )}
                                            >
                                                {/* Value */}
                                                <div className="min-w-[120px]">
                                                    <Badge variant="destructive" className="font-mono">
                                                        {value}
                                                    </Badge>
                                                </div>

                                                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 flex-1">
                                                    {/* Create Button */}
                                                    {conflict.allowCreate && (
                                                        <Button
                                                            size="sm"
                                                            variant={resolution?.action === 'create' ? "default" : "outline"}
                                                            onClick={() => handleCreate(conflict, value)}
                                                            disabled={isCreating || resolution?.action === 'create'}
                                                            className="shrink-0"
                                                        >
                                                            {isCreating ? (
                                                                <>Creando...</>
                                                            ) : resolution?.action === 'create' ? (
                                                                <><Check className="h-3 w-3 mr-1" /> Creado</>
                                                            ) : (
                                                                <><Plus className="h-3 w-3 mr-1" /> Crear &quot;{value}&quot;</>
                                                            )}
                                                        </Button>
                                                    )}

                                                    {/* Map to Existing */}
                                                    <Select
                                                        value={resolution?.action === 'map' ? resolution.targetId : ''}
                                                        onValueChange={(targetId) => {
                                                            handleResolutionChange(conflict.field, value, 'map', targetId);
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Usar existente..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {conflict.existingOptions.map((opt) => (
                                                                <SelectItem key={opt.id} value={opt.id}>
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    {/* Ignore Button */}
                                                    <Button
                                                        size="sm"
                                                        variant={resolution?.action === 'ignore' ? "destructive" : "ghost"}
                                                        onClick={() => handleResolutionChange(conflict.field, value, 'ignore')}
                                                        className="shrink-0"
                                                    >
                                                        <X className="h-3 w-3 mr-1" />
                                                        Ignorar
                                                    </Button>
                                                </div>

                                                {/* Status */}
                                                {resolution?.action && (
                                                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </motion.div>
    );
}
