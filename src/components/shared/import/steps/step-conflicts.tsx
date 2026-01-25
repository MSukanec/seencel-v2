import { useState, useEffect } from "react";
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
    // Initialize resolutions with matched values
    const [resolutions, setResolutions] = useState<Record<string, Record<string, ValueResolution>>>(() => {
        const initialBreaks: Record<string, Record<string, ValueResolution>> = {};

        conflicts.forEach(c => {
            if (c.matchedValues && c.matchedValues.length > 0) {
                initialBreaks[c.field] = {};
                c.matchedValues.forEach(m => {
                    initialBreaks[c.field][m.original] = {
                        action: 'map',
                        targetId: m.targetId
                    };
                });
            }
        });

        return initialBreaks;
    });

    const [creatingValues, setCreatingValues] = useState<Set<string>>(new Set());

    // Count pure conflicts (missing values)
    const totalMissing = conflicts.reduce((acc, c) => acc + c.missingValues.length, 0);

    // Count resolved MISSING values (we don't count matches as "resolved work" for the user, but we track them)
    // Actually, simply check if all MISSING values have a resolution in the state
    const missingResolvedCount = conflicts.reduce((acc, c) => {
        const fieldResolutions = resolutions[c.field] || {};
        const resolvedForField = c.missingValues.filter(val => {
            const res = fieldResolutions[val];
            return res && res.action !== null;
        }).length;
        return acc + resolvedForField;
    }, 0);

    const isAllResolved = missingResolvedCount >= totalMissing;

    // Trigger update on mount (to push initial matched resolutions) and on changes
    // We use a comprehensive effect to ensure parent always has full map
    useEffect(() => {
        const resolutionMap: ResolutionMap = {};

        // 1. Add manual resolutions (and pre-filled matches from state)
        for (const [fieldKey, fieldValues] of Object.entries(resolutions)) {
            resolutionMap[fieldKey] = {};
            for (const [valueKey, res] of Object.entries(fieldValues)) {
                if (res.action === 'map' && res.targetId) {
                    resolutionMap[fieldKey][valueKey] = {
                        action: 'map',
                        targetId: res.targetId!,
                        originalValue: valueKey
                    };
                } else if (res.action === 'ignore') {
                    resolutionMap[fieldKey][valueKey] = {
                        action: 'ignore',
                        originalValue: valueKey
                    };
                } else if (res.action === 'create') {
                    resolutionMap[fieldKey][valueKey] = {
                        action: 'create',
                        targetId: res.targetId, // Can be undefined now (deferred)
                        originalValue: valueKey
                    };
                }
            }
        }

        onResolutionsChange(resolutionMap, isAllResolved);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolutions, isAllResolved]);

    const handleResolutionChange = (
        field: string,
        value: string,
        action: ResolutionAction,
        targetId?: string
    ) => {
        setResolutions(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                [value]: { action, targetId }
            }
        }));
    };

    const handleCreate = (conflict: FKConflict, value: string) => {
        const column = config.columns.find(c => String(c.id) === conflict.field);
        if (!column?.foreignKey?.allowCreate) return;

        // Defer creation: Just mark as 'create'. The actual creation happens on Import.
        handleResolutionChange(conflict.field, value, 'create', undefined);
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
                <div className={cn(
                    "border rounded-lg p-4 flex items-center gap-3",
                    totalMissing > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-green-500/10 border-green-500/20"
                )}>
                    <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        totalMissing > 0 ? "bg-amber-500/20 text-amber-600" : "bg-green-500/20 text-green-600"
                    )}>
                        {totalMissing > 0 ? <AlertTriangle className="h-6 w-6" /> : <Check className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                        <div className={cn(
                            "text-lg font-semibold",
                            totalMissing > 0 ? "text-amber-700" : "text-green-700"
                        )}>
                            {totalMissing > 0
                                ? `${totalMissing} valor${totalMissing > 1 ? 'es' : ''} no encontrado${totalMissing > 1 ? 's' : ''}`
                                : "Todos los valores coinciden"
                            }
                        </div>
                        <div className={cn(
                            "text-xs",
                            totalMissing > 0 ? "text-amber-600/80" : "text-green-600/80"
                        )}>
                            {totalMissing > 0 ? "Resuelve los conflictos antes de continuar" : "Revisa las coincidencias automáticas"}
                        </div>
                    </div>
                    {totalMissing > 0 && (
                        <Badge variant={isAllResolved ? "default" : "secondary"}>
                            {missingResolvedCount} / {totalMissing} resueltos
                        </Badge>
                    )}
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
                                    <div className="flex gap-2">
                                        {(() => {
                                            const missingCount = conflict.missingValues.length;
                                            const resolvedCount = conflict.missingValues.filter(val => resolutions[conflict.field]?.[val]?.action).length;
                                            const remaining = missingCount - resolvedCount;

                                            if (remaining > 0) {
                                                return (
                                                    <Badge className="text-xs bg-error text-white hover:bg-error/90 border-transparent">
                                                        {remaining} faltante{remaining > 1 ? 's' : ''}
                                                    </Badge>
                                                );
                                            } else if (missingCount > 0) {
                                                return (
                                                    <Badge className="text-xs bg-success text-white hover:bg-success/90 border-transparent">
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Resuelto
                                                    </Badge>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {conflict.matchedValues && conflict.matchedValues.length > 0 && (
                                            <Badge className="text-xs bg-success text-white hover:bg-success/90 border-transparent">
                                                {conflict.matchedValues.length} coincidencia{conflict.matchedValues.length > 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="divide-y text-sm">
                                    {/* Missing Values (Conflicts) */}
                                    {conflict.missingValues.map((value) => {
                                        const resolution = resolutions[conflict.field]?.[value];
                                        const isCreating = creatingValues.has(`${conflict.field}:${value}`);
                                        const isResolved = !!resolution?.action;

                                        return (
                                            <div
                                                key={`missing-${value}`}
                                                className={cn(
                                                    "px-4 py-3 flex items-center gap-4 transition-colors",
                                                    isResolved ? "bg-success/5" : "hover:bg-muted/30"
                                                )}
                                            >
                                                <div className="min-w-[140px]">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold shadow-sm transition-colors",
                                                        isResolved
                                                            ? "bg-success text-white"
                                                            : "bg-error text-white"
                                                    )}>
                                                        {value}
                                                    </span>
                                                </div>

                                                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

                                                <div className="flex items-center gap-2 flex-1">
                                                    <Select
                                                        value={resolution?.action === 'map' ? resolution.targetId : ''}
                                                        onValueChange={(targetId) => {
                                                            handleResolutionChange(conflict.field, value, 'map', targetId);
                                                        }}
                                                    >
                                                        <SelectTrigger className="flex-1 h-8 text-xs">
                                                            <SelectValue placeholder="Seleccionar..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {conflict.existingOptions.map((opt) => (
                                                                <SelectItem key={opt.id} value={opt.id} className="text-xs">
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    {conflict.allowCreate && (
                                                        <Button
                                                            size="sm"
                                                            variant={resolution?.action === 'create' ? "default" : "outline"}
                                                            onClick={() => handleCreate(conflict, value)}
                                                            disabled={isCreating || resolution?.action === 'create'}
                                                            className="shrink-0 h-8 text-xs"
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

                                                    <Button
                                                        size="sm"
                                                        variant={resolution?.action === 'ignore' ? "destructive" : "ghost"}
                                                        onClick={() => handleResolutionChange(conflict.field, value, 'ignore')}
                                                        className="shrink-0 h-8 w-8 p-0"
                                                        title="Ignorar fila"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Matched Values (Auto-resolved) */}
                                    {conflict.matchedValues?.map((match) => {
                                        const resolution = resolutions[conflict.field]?.[match.original];
                                        const isCreating = creatingValues.has(`${conflict.field}:${match.original}`);
                                        // A match is implicitly resolved unless overridden
                                        const currentTargetId = resolution?.action === 'map' ? resolution.targetId : match.targetId;
                                        const isResolved = resolution ? (!!resolution.action) : true; // Default true for match
                                        const isIgnored = resolution?.action === 'ignore';

                                        return (
                                            <div
                                                key={`match-${match.original}`}
                                                className={cn(
                                                    "px-4 py-3 flex items-center gap-4 transition-colors",
                                                    isResolved && !isIgnored ? "bg-success/5" : "hover:bg-muted/30"
                                                )}
                                            >
                                                <div className="min-w-[140px]">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold shadow-sm transition-colors",
                                                        (isResolved && !isIgnored)
                                                            ? "bg-success text-white"
                                                            : "bg-error text-white"
                                                    )}>
                                                        {match.original}
                                                    </span>
                                                </div>

                                                <ArrowRight className="h-4 w-4 text-success/50 shrink-0" />

                                                <div className="flex items-center gap-2 flex-1">
                                                    <Select
                                                        value={isIgnored ? '' : (currentTargetId || '')}
                                                        onValueChange={(targetId) => {
                                                            handleResolutionChange(conflict.field, match.original, 'map', targetId);
                                                        }}
                                                    >
                                                        <SelectTrigger className="flex-1 h-8 text-xs bg-background border border-input shadow-sm">
                                                            <SelectValue placeholder="Seleccionar..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {conflict.existingOptions.map((opt) => (
                                                                <SelectItem key={opt.id} value={opt.id} className="text-xs">
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    {conflict.allowCreate && (
                                                        <Button
                                                            size="sm"
                                                            variant={resolution?.action === 'create' ? "default" : "outline"}
                                                            onClick={() => handleCreate(conflict, match.original)}
                                                            disabled={isCreating || resolution?.action === 'create'}
                                                            className="shrink-0 h-8 text-xs"
                                                        >
                                                            {isCreating ? (
                                                                <>Creando...</>
                                                            ) : resolution?.action === 'create' ? (
                                                                <><Check className="h-3 w-3 mr-1" /> Creado</>
                                                            ) : (
                                                                <><Plus className="h-3 w-3 mr-1" /> Crear &quot;{match.original}&quot;</>
                                                            )}
                                                        </Button>
                                                    )}

                                                    <Button
                                                        size="sm"
                                                        variant={isIgnored ? "destructive" : "ghost"}
                                                        onClick={() => handleResolutionChange(conflict.field, match.original, isIgnored ? 'map' : 'ignore', isIgnored ? match.targetId : undefined)}
                                                        className={cn("shrink-0 h-8 w-8 p-0", isIgnored ? "opacity-100" : "opacity-30 hover:opacity-100")}
                                                        title={isIgnored ? "Restaurar" : "Ignorar fila"}
                                                    >
                                                        {isIgnored ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                    </Button>
                                                </div>
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


