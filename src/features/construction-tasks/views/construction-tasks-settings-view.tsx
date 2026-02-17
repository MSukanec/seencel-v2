"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CalendarDays, Check, Info } from "lucide-react";
import { toast } from "sonner";

import { upsertProjectSettings, fetchProjectSettingsAction } from "../actions";

import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { cn } from "@/lib/utils";
import { useActiveProjectId } from "@/stores/layout-store";

// ============================================================================
// Types
// ============================================================================

interface ConstructionTasksSettingsViewProps {
    projectId?: string;
    organizationId: string;
    initialWorkDays?: number[];
    onWorkDaysChange?: (workDays: number[]) => void;
}

// Days of the week: 0=domingo ... 6=sábado
const DAYS_OF_WEEK = [
    { value: 1, label: "Lun", fullLabel: "Lunes" },
    { value: 2, label: "Mar", fullLabel: "Martes" },
    { value: 3, label: "Mié", fullLabel: "Miércoles" },
    { value: 4, label: "Jue", fullLabel: "Jueves" },
    { value: 5, label: "Vie", fullLabel: "Viernes" },
    { value: 6, label: "Sáb", fullLabel: "Sábado" },
    { value: 0, label: "Dom", fullLabel: "Domingo" },
];

const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5];
const AUTOSAVE_DELAY = 1000; // 1 second debounce

// ============================================================================
// Component
// ============================================================================

export function ConstructionTasksSettingsView({
    projectId: propProjectId,
    organizationId,
    initialWorkDays,
    onWorkDaysChange,
}: ConstructionTasksSettingsViewProps) {
    const storeProjectId = useActiveProjectId();
    const activeProjectId = storeProjectId ?? propProjectId ?? null;

    const [workDays, setWorkDays] = useState<number[]>(initialWorkDays ?? DEFAULT_WORK_DAYS);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [isLoading, setIsLoading] = useState(false);
    const saveTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
    const isFirstRender = useRef(true);
    const lastLoadedProjectId = useRef<string | null>(null);

    // Load project settings when activeProjectId changes (org-level usage)
    useEffect(() => {
        if (!activeProjectId) return;
        if (activeProjectId === lastLoadedProjectId.current) return;
        if (initialWorkDays && isFirstRender.current && propProjectId === activeProjectId) {
            lastLoadedProjectId.current = activeProjectId;
            return;
        }

        lastLoadedProjectId.current = activeProjectId;
        setIsLoading(true);
        fetchProjectSettingsAction(activeProjectId).then((settings: { work_days: number[] }) => {
            setWorkDays(settings.work_days);
            setIsLoading(false);
        });
    }, [activeProjectId, initialWorkDays, propProjectId]);

    // Auto-save with debounce when workDays changes
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (!activeProjectId) return;

        if (saveTimeout.current) {
            clearTimeout(saveTimeout.current);
        }

        setSaveStatus("saving");

        saveTimeout.current = setTimeout(async () => {
            try {
                const result = await upsertProjectSettings(activeProjectId, organizationId, workDays);
                if (result.success) {
                    setSaveStatus("saved");
                    onWorkDaysChange?.(workDays);
                    setTimeout(() => setSaveStatus("idle"), 2000);
                } else {
                    setSaveStatus("idle");
                    toast.error(result.error || "Error al guardar");
                }
            } catch {
                setSaveStatus("idle");
                toast.error("Error inesperado al guardar");
            }
        }, AUTOSAVE_DELAY);

        return () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workDays]);

    const toggleDay = useCallback((day: number) => {
        setWorkDays(prev => {
            const next = prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort((a, b) => a - b);

            if (next.length === 0) {
                toast.error("Debe haber al menos un día laboral");
                return prev;
            }

            return next;
        });
    }, []);

    // No project selected
    if (!activeProjectId) {
        return (
            <div className="h-full overflow-y-auto">
                <div className="max-w-5xl mx-auto px-6 md:px-8 py-8">
                    <SettingsSection
                        icon={Info}
                        title="Seleccioná un Proyecto"
                        description="Para configurar los ajustes de ejecución, primero seleccioná un proyecto desde el selector en el header. Los ajustes como días laborales y preferencias de planificación son específicos de cada proyecto."
                    >
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                            <p className="text-sm text-muted-foreground">
                                Los cambios que realices acá se aplicarán únicamente al proyecto seleccionado.
                            </p>
                        </div>
                    </SettingsSection>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-full overflow-y-auto">
                <div className="max-w-5xl mx-auto px-6 md:px-8 py-8">
                    <SettingsSection
                        icon={CalendarDays}
                        title="Días Laborales"
                        description="Cargando configuración del proyecto..."
                    >
                        <div className="animate-pulse space-y-4">
                            <div className="flex gap-2">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <div key={i} className="w-16 h-16 rounded-lg bg-muted" />
                                ))}
                            </div>
                        </div>
                    </SettingsSection>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto px-6 md:px-8 py-8">
                <SettingsSectionContainer>
                    <SettingsSection
                        icon={CalendarDays}
                        title="Días Laborales"
                        description="Seleccioná qué días de la semana se trabaja en este proyecto. Los días no laborales se mostrarán atenuados en el diagrama de Gantt y no se contarán para calcular duraciones."
                    >
                        <div className="space-y-4">
                            {/* Day toggles */}
                            <div className="flex flex-wrap gap-2">
                                {DAYS_OF_WEEK.map(day => {
                                    const isActive = workDays.includes(day.value);
                                    return (
                                        <button
                                            key={day.value}
                                            onClick={() => toggleDay(day.value)}
                                            className={cn(
                                                "flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 transition-all duration-200",
                                                "hover:scale-105 cursor-pointer select-none",
                                                isActive
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/40"
                                            )}
                                            title={day.fullLabel}
                                        >
                                            <span className={cn(
                                                "text-sm font-semibold",
                                                isActive && "text-primary"
                                            )}>
                                                {day.label}
                                            </span>
                                            <div className={cn(
                                                "w-2 h-2 rounded-full mt-1 transition-colors",
                                                isActive ? "bg-primary" : "bg-muted-foreground/20"
                                            )} />
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Summary + auto-save status */}
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">
                                    {workDays.length === 7
                                        ? "Todos los días son laborales."
                                        : workDays.length === 5 && [1, 2, 3, 4, 5].every(d => workDays.includes(d))
                                            ? "Semana laboral estándar (Lunes a Viernes)."
                                            : `${workDays.length} días laborales por semana.`
                                    }
                                </p>
                                {saveStatus === "saving" && (
                                    <span className="text-xs text-muted-foreground/60 animate-pulse">
                                        Guardando...
                                    </span>
                                )}
                                {saveStatus === "saved" && (
                                    <span className="text-xs text-primary flex items-center gap-1">
                                        <Check className="h-3 w-3" />
                                        Guardado
                                    </span>
                                )}
                            </div>
                        </div>
                    </SettingsSection>
                </SettingsSectionContainer>
            </div>
        </div>
    );
}
