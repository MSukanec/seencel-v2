"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder } from "lucide-react";
import { usePanel } from "@/stores/panel-store";

interface CategoryFormProps {
    initialData?: {
        id: string;
        name: string | null;
        parent_id: string | null;
    };
    parentId?: string | null;
    onSubmit: (name: string, parentId: string | null) => Promise<{ error?: string; data?: any }>;
    onSuccess: () => void;
    formId?: string;
}

export function CategoryForm({ initialData, parentId, onSubmit, onSuccess, formId }: CategoryFormProps) {
    const { setPanelMeta } = usePanel();
    const [name, setName] = useState(initialData?.name || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!initialData;
    const effectiveParentId = initialData?.parent_id ?? parentId ?? null;

    // Self-describe
    useEffect(() => {
        setPanelMeta({
            icon: Folder,
            title: isEditing
                ? "Editar Categoría"
                : parentId ? "Nueva Subcategoría" : "Nueva Categoría",
            description: isEditing
                ? "Modifica el nombre de la categoría"
                : parentId
                    ? "Crear una subcategoría dentro de la categoría seleccionada"
                    : "Crear una nueva categoría de materiales",
            size: "md",
            footer: {
                submitLabel: isEditing ? "Guardar cambios" : "Crear categoría"
            }
        });
    }, [isEditing, parentId, setPanelMeta]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("El nombre es requerido");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await onSubmit(name.trim(), effectiveParentId);
            if (result.error) {
                setError(result.error);
            } else {
                onSuccess();
            }
        } catch (err) {
            setError("Error al guardar la categoría");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Folder className="h-8 w-8 text-muted-foreground" />
                <div>
                    <p className="font-medium">{isEditing ? "Editar Categoría" : "Nueva Categoría"}</p>
                    <p className="text-sm text-muted-foreground">
                        {isEditing ? "Modifica el nombre de la categoría" : "Ingresa el nombre de la nueva categoría"}
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Adhesivos y Selladores"
                    autoFocus
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
        </form>
    );
}
