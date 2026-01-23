"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder } from "lucide-react";

interface CategoryFormProps {
    initialData?: {
        id: string;
        name: string | null;
        parent_id: string | null;
    };
    parentId?: string | null;
    onSubmit: (name: string, parentId: string | null) => Promise<{ error?: string; data?: any }>;
    onSuccess: () => void;
}

export function CategoryForm({ initialData, parentId, onSubmit, onSuccess }: CategoryFormProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!initialData;
    const effectiveParentId = initialData?.parent_id ?? parentId ?? null;

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
        <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : (isEditing ? "Guardar cambios" : "Crear categoría")}
                </Button>
            </div>
        </form>
    );
}

