"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { submitFeedback } from "@/actions/submit-feedback";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Textarea } from "@/components/ui/textarea";

interface FeedbackFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function FeedbackForm({ onSuccess, onCancel }: FeedbackFormProps) {
    const t = useTranslations('Feedback');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            toast.error(t('emptyMessage') || "El mensaje no puede estar vacío");
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("message", message);

            const result = await submitFeedback(formData);

            if (result.success) {
                toast.success(t('successTitle') || "Feedback enviado correctamente");
                onSuccess?.();
            } else {
                console.error(result.error);
                toast.error(t('errorMessage') || "Error al enviar feedback");
            }
        } catch (error) {
            console.error(error);
            toast.error(t('errorMessage') || "Error al enviar feedback");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    {/* We can use FormGroup if we had a label, but standard feedback usually just has a big textarea. 
                         However, to stick to standard padding/layout:
                     */}
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            {t('description') || "Tu opinión nos ayuda a mejorar. Cuéntanos qué piensas o reporta un problema."}
                        </p>
                        <Textarea
                            placeholder={t('placeholder') || "Escribe tu feedback aquí..."}
                            className="min-h-[150px] resize-none text-sm focus-visible:ring-1"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={t('send') || "Enviar Feedback"}
                onCancel={onCancel}
            />
        </form>
    );
}
