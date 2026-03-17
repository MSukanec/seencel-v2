"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { submitFeedback } from "@/actions/submit-feedback";
import { Textarea } from "@/components/ui/textarea";
import { usePanel } from "@/stores/panel-store";

// ============================================================================
// FEEDBACK FORM — Panel-based
// ============================================================================
// Opens via openPanel('feedback-form').
// Self-contained: sets its own panel meta (icon, title, description, footer).
// ============================================================================

export function FeedbackForm() {
    const t = useTranslations('Feedback');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const { closePanel, setPanelMeta, setSubmitting } = usePanel();

    // Set panel meta
    useEffect(() => {
        setPanelMeta({
            icon: Sparkles,
            title: t('title') || "Enviar Comentarios",
            description: t('modalDescription') || "Envíanos tus comentarios o reporta un problema.",
            footer: {
                submitLabel: t('send') || "Enviar",
            },
        });
    }, [setPanelMeta, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            toast.error(t('emptyMessage') || "El mensaje no puede estar vacío");
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("message", message);

            const result = await submitFeedback(formData);

            if (result.success) {
                toast.success(t('successTitle') || "Feedback enviado correctamente");
                closePanel();
            } else {
                console.error(result.error);
                toast.error(t('errorMessage') || "Error al enviar feedback");
                setSubmitting(false);
            }
        } catch (error) {
            console.error(error);
            toast.error(t('errorMessage') || "Error al enviar feedback");
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto space-y-3">
                <p className="text-sm text-muted-foreground">
                    {t('description') || "Tu opinión nos ayuda a mejorar. Cuéntanos qué piensas o reporta un problema."}
                </p>
                <Textarea
                    placeholder={t('placeholder') || "Escribe tu feedback aquí..."}
                    className="min-h-[150px] resize-none text-sm focus-visible:ring-1"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                />
            </div>
        </form>
    );
}
