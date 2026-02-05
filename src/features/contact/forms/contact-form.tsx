"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createContact, updateContact } from "@/actions/contacts";
import { ContactWithRelations, ContactType } from "@/types/contact";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { PhoneInput } from "@/components/ui/phone-input";

import { ContactAvatarManager } from "@/features/contact/components/contact-avatar-manager";

interface ContactFormProps {
    organizationId: string;
    contactTypes: ContactType[];
    initialData?: ContactWithRelations;
    onSuccess?: () => void;
}

export function ContactForm({ organizationId, contactTypes, initialData, onSuccess }: ContactFormProps) {
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        first_name: initialData?.first_name || "",
        last_name: initialData?.last_name || "",
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        company_name: initialData?.company_name || "",
        location: initialData?.location || "",
        notes: initialData?.notes || "",
        image_url: initialData?.image_url || "",
        typeIds: initialData?.contact_types ? initialData.contact_types.map(t => t.id) : [] as string[]
    });

    const toggleType = (typeId: string) => {
        setFormData(prev => {
            const exists = prev.typeIds.includes(typeId);
            if (exists) return { ...prev, typeIds: prev.typeIds.filter(id => id !== typeId) };
            return { ...prev, typeIds: [...prev.typeIds, typeId] };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const dataToSave = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                full_name: `${formData.first_name} ${formData.last_name}`.trim(),
                email: formData.email.trim() || null,
                phone: formData.phone || null,
                company_name: formData.company_name || null,
                location: formData.location || null,
                notes: formData.notes || null,
                image_url: formData.image_url || null,
            };

            if (initialData) {
                await updateContact(initialData.id, dataToSave, formData.typeIds);
                toast.success("Contacto actualizado correctamente");
            } else {
                await createContact(organizationId, dataToSave, formData.typeIds);
                toast.success("Contacto creado correctamente");
            }

            if (onSuccess) onSuccess();
            closeModal();

        } catch (error) {
            console.error("Failed to save contact", error);
            toast.error("Error al guardar el contacto");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4">

                {/* Avatar Section */}
                <div className="flex justify-center pb-2">
                    <ContactAvatarManager
                        initials={formData.first_name?.[0] || formData.last_name?.[0] || "?"}
                        currentPath={formData.image_url}
                        onPathChange={(path) => setFormData(prev => ({ ...prev, image_url: path || "" }))}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="first_name">Nombre</Label>
                        <Input
                            id="first_name"
                            value={formData.first_name}
                            onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                            placeholder="Ej. Juan"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="last_name">Apellido</Label>
                        <Input
                            id="last_name"
                            value={formData.last_name}
                            onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                            placeholder="Ej. Pérez"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="juan@ejemplo.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <PhoneInput
                            id="phone"
                            defaultCountry="AR"
                            value={formData.phone}
                            onChange={(value) => setFormData({ ...formData, phone: value || "" })}
                            placeholder="+54 9 11..."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="company">Empresa</Label>
                        <Input
                            id="company"
                            value={formData.company_name}
                            onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                            placeholder="Nombre de la empresa"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Ubicación</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Ciudad, País"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Etiquetas / Tipos</Label>
                    <div className="flex flex-wrap gap-2 border rounded-md p-3 bg-muted/20">
                        {contactTypes.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No hay tipos disponibles.</p>
                        ) : (
                            contactTypes.map(type => (
                                <div key={type.id} className="flex items-center space-x-2 bg-background border px-2 py-1 rounded-sm">
                                    <Checkbox
                                        id={`type-${type.id}`}
                                        checked={formData.typeIds.includes(type.id)}
                                        onCheckedChange={() => toggleType(type.id)}
                                    />
                                    <Label htmlFor={`type-${type.id}`} className="text-sm font-normal cursor-pointer">
                                        {type.name}
                                    </Label>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="min-h-[100px]"
                        placeholder="Información adicional..."
                    />
                </div>
            </div>

            <FormFooter
                onCancel={closeModal}
                isLoading={isLoading}
                submitLabel={initialData ? "Guardar Cambios" : "Crear Contacto"}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
