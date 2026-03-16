"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, AlertTriangle } from "lucide-react";
import { ProjectField, type Project } from "@/components/shared/forms/fields";
import { swapProjectStatus } from "@/features/projects/actions";
import { toast } from "sonner";

interface ProjectSwapModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The project the user wants to create/activate */
    projectToActivate: {
        id: string;
        name: string;
    };
    /** List of currently active/planning projects (excluding the one being activated) */
    activeProjects: (Project & { status?: string })[];
    /** Max allowed by plan */
    maxAllowed: number;
    /** Called after successful swap */
    onSwapSuccess?: (activatedId: string, deactivatedId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
    active: "Activo",
    planning: "Planificación",
};

export function ProjectSwapModal({
    open,
    onOpenChange,
    projectToActivate,
    activeProjects,
    maxAllowed,
    onSwapSuccess,
}: ProjectSwapModalProps) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [isSwapping, setIsSwapping] = useState(false);

    const handleSwap = async () => {
        if (!selectedProjectId) {
            toast.error("Seleccioná un proyecto para desactivar.");
            return;
        }

        setIsSwapping(true);
        const toastId = toast.loading("Intercambiando proyectos...", { duration: Infinity });

        try {
            const result = await swapProjectStatus(
                projectToActivate.id,
                selectedProjectId,
                "inactive"
            );

            if (result.error) {
                toast.error(result.error, { id: toastId });
            } else {
                const deactivatedProject = activeProjects.find(p => p.id === selectedProjectId);
                toast.success(
                    `"${deactivatedProject?.name}" pasó a Inactivo. Ahora podés crear tu nuevo proyecto.`,
                    { id: toastId }
                );
                onSwapSuccess?.(projectToActivate.id, selectedProjectId);
                onOpenChange(false);
            }
        } catch (error) {
            toast.error("Error inesperado al intercambiar proyectos.", { id: toastId });
        } finally {
            setIsSwapping(false);
        }
    };

    const selectedProject = activeProjects.find(p => p.id === selectedProjectId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-semantic-warning mb-1">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="text-sm font-medium">Límite de plan alcanzado</span>
                    </div>
                    <DialogTitle>Liberar espacio para un nuevo proyecto</DialogTitle>
                    <DialogDescription>
                        Tu plan permite un máximo de <strong>{maxAllowed} proyecto{maxAllowed !== 1 ? "s" : ""}</strong> activo{maxAllowed !== 1 ? "s" : ""} o en planificación simultáneamente.
                        Para continuar, seleccioná un proyecto existente para pasarlo a <strong>Inactivo</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Project Select — sin tooltip */}
                    <ProjectField
                        value={selectedProjectId}
                        onChange={setSelectedProjectId}
                        projects={activeProjects}
                        label="¿Cuál proyecto querés pasar a Inactivo?"
                        tooltip={null}
                        placeholder="Seleccioná un proyecto..."
                        emptyMessage="No hay proyectos para intercambiar."
                        required={false}
                        allowNone={false}
                    />

                    {/* Preview of what will happen */}
                    {selectedProject && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-semantic-warning/10 border border-semantic-warning/20">
                            {selectedProject.image_url ? (
                                <img
                                    src={selectedProject.image_url}
                                    alt={selectedProject.name}
                                    className="w-6 h-6 rounded-full object-cover shrink-0"
                                />
                            ) : (
                                <div
                                    className="w-6 h-6 rounded-full shrink-0"
                                    style={{ backgroundColor: selectedProject.color || "#007AFF" }}
                                />
                            )}
                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                    {selectedProject.name}
                                    {(selectedProject as any).status && (
                                        <span className="text-xs text-muted-foreground ml-1.5">
                                            ({STATUS_LABELS[(selectedProject as any).status] || (selectedProject as any).status})
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Pasará a <span className="text-semantic-warning font-medium">Inactivo</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <a
                        href="/precios"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Crown className="h-3.5 w-3.5 text-semantic-warning" />
                        Upgrade a PRO para más proyectos
                    </a>
                    <div className="flex gap-2 ml-auto">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSwapping}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSwap}
                            disabled={!selectedProjectId || isSwapping}
                        >
                            {isSwapping ? "Intercambiando..." : "Confirmar"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
