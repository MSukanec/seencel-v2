"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Globe, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type TaskCreationType = "own" | "parametric";

interface TaskTypeSelectorProps {
    onSelect: (type: TaskCreationType) => void;
    onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Modal content for selecting between creating own task vs parametric task
 */
export function TaskTypeSelector({ onSelect, onCancel }: TaskTypeSelectorProps) {
    return (
        <div className="flex flex-col gap-6">
            <div className="text-center">
                <p className="text-muted-foreground">
                    ¿Qué tipo de tarea querés crear?
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tarea Propia */}
                <Card
                    className={cn(
                        "cursor-pointer transition-all hover:border-primary hover:shadow-md",
                        "group"
                    )}
                    onClick={() => onSelect("own")}
                >
                    <CardHeader className="pb-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2 group-hover:bg-blue-500/20 transition-colors">
                            <Home className="h-6 w-6 text-blue-500" />
                        </div>
                        <CardTitle className="text-lg">Tarea Propia</CardTitle>
                        <CardDescription>
                            Solo para mi organización
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Nombre libre, vos lo escribís</li>
                            <li>• No se comparte con otros</li>
                            <li>• Ideal para tareas específicas</li>
                        </ul>
                        <Button variant="ghost" className="w-full mt-4 group-hover:bg-blue-500/10">
                            Crear Tarea Propia
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Tarea Paramétrica - Sistema */}
                <Card
                    className={cn(
                        "cursor-pointer transition-all border-primary/50 hover:border-primary hover:shadow-lg hover:shadow-primary/10",
                        "group relative overflow-hidden bg-primary/5"
                    )}
                    onClick={() => onSelect("parametric")}
                >
                    {/* Badge */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        Recomendado
                    </div>

                    <CardHeader className="pb-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-2 group-hover:bg-primary/30 transition-colors">
                            <Globe className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Tarea Paramétrica</CardTitle>
                        <CardDescription>
                            Colaborar con Seencel
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Nombre generado automáticamente</li>
                            <li>• Recetas reutilizables</li>
                            <li>• Contribuye al catálogo global</li>
                        </ul>
                        <Button variant="default" className="w-full mt-4">
                            Crear Tarea Paramétrica
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {onCancel && (
                <div className="flex justify-center">
                    <Button variant="ghost" onClick={onCancel}>
                        Cancelar
                    </Button>
                </div>
            )}
        </div>
    );
}
