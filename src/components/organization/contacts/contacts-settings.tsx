"use client";

import { useState } from "react";
import { ContactType } from "@/types/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { createContactType, updateContactType, deleteContactType } from "@/actions/contacts";

interface ContactsSettingsProps {
    organizationId: string;
    initialTypes: ContactType[];
}

export function ContactsSettings({ organizationId, initialTypes }: ContactsSettingsProps) {
    const [newTypeName, setNewTypeName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");

    const handleCreate = async () => {
        if (!newTypeName.trim()) return;
        await createContactType(organizationId, newTypeName);
        setNewTypeName("");
    };

    const handleDelete = async (id: string) => {
        if (confirm("Al eliminar este tipo, se removerá de todos los contactos asociados. ¿Continuar?")) {
            await deleteContactType(id);
            if (editingId === id) cancelEdit();
        }
    };

    const startEdit = (type: ContactType) => {
        setEditingId(type.id);
        setEditingName(type.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingName("");
    };

    const saveEdit = async () => {
        if (editingId && editingName.trim()) {
            await updateContactType(editingId, editingName);
            cancelEdit();
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Tipos de Contacto</CardTitle>
                    <CardDescription>
                        Define las categorías para organizar tus contactos (ej. Cliente, Proveedor, Contratista).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Add New */}
                    <div className="flex gap-4 items-end max-w-sm">
                        <div className="w-full space-y-2">
                            <Input
                                placeholder="Nombre de categoría..."
                                value={newTypeName}
                                onChange={(e) => setNewTypeName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            />
                        </div>
                        <Button onClick={handleCreate} disabled={!newTypeName.trim()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar
                        </Button>
                    </div>

                    {/* List */}
                    <div className="border rounded-md divide-y">
                        {initialTypes.length === 0 ? (
                            <div className="p-4 text-sm text-center text-muted-foreground">
                                No hay tipos de contacto definidos.
                            </div>
                        ) : (
                            initialTypes.map((type) => (
                                <div key={type.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                    {editingId === type.id ? (
                                        <div className="flex items-center gap-2 flex-1 mr-4">
                                            <Input
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="h-8"
                                                autoFocus
                                            />
                                            <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 w-8 p-0 text-green-600">
                                                <Save className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0 text-muted-foreground">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="font-medium text-sm pl-2">{type.name}</span>
                                    )}

                                    {editingId !== type.id && (
                                        <div className="flex items-center gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => startEdit(type)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleDelete(type.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
