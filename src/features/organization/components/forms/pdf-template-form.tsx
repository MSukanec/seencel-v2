"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";

interface PdfTemplateFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    onSubmit: (name: string) => Promise<void>;
}

/**
 * Form for creating a new PDF template.
 * Follows the Seencel Forms & Modals standard.
 */
export function PdfTemplateForm({ onSuccess, onCancel, onSubmit }: PdfTemplateFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [templateName, setTemplateName] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!templateName.trim()) return;

        setIsLoading(true);
        try {
            await onSubmit(templateName);
            onSuccess?.();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4">
                    <FormGroup label="Nombre de la Plantilla">
                        <Input
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="Ej: Facturas Corporativas"
                            autoFocus
                        />
                    </FormGroup>
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel="Crear Plantilla"
                onCancel={onCancel}
                submitDisabled={!templateName.trim()}
            />
        </form>
    );
}
