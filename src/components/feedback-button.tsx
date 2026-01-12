"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquarePlus, Send } from "lucide-react";

import { submitFeedback } from "@/actions/submit-feedback";
import { useTranslations } from "next-intl";

interface FeedbackButtonProps {
    customTrigger?: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
}

export function FeedbackButton({ customTrigger, side = "bottom", align = "end" }: FeedbackButtonProps) {
    const t = useTranslations('Feedback');
    const [isOpen, setIsOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [message, setMessage] = React.useState("");
    const [isSuccess, setIsSuccess] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsLoading(true);

        const formData = new FormData();
        formData.append("message", message);

        const result = await submitFeedback(formData);

        setIsLoading(false);

        if (result.success) {
            setIsSuccess(true);
            setMessage("");
            // Reset after a moment or let user close
            setTimeout(() => {
                setIsOpen(false);
                setIsSuccess(false);
            }, 1500);
        } else {
            // Check if we have toast, otherwise alert for now?
            // Or just show error text
            console.error(result.error);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {customTrigger ? customTrigger : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 px-3 text-xs font-medium"
                    >
                        {t('button')}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align={align} side={side} sideOffset={8}>
                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-2 text-center animate-in fade-in zoom-in duration-300">
                        <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <Send className="h-5 w-5" />
                        </div>
                        <p className="font-medium text-sm">{t('successTitle')}</p>
                        <p className="text-xs text-muted-foreground">{t('successMessage')}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <div className="px-4 py-3 border-b border-border/10 bg-muted/30">
                            <h4 className="font-medium text-sm">{t('title')}</h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-normal">
                                {t('description')}
                            </p>
                        </div>
                        <div className="p-4 space-y-4">
                            <Textarea
                                placeholder={t('placeholder')}
                                className="min-h-[100px] resize-none text-sm focus-visible:ring-1"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={isLoading}
                            />
                            <div className="flex items-center justify-between">
                                <div className="flex gap-1">
                                    {/* Optional emoji reactions if we wanted to match screenshot 1:1, but user said 'sin select' */}
                                </div>
                                <Button size="sm" type="submit" disabled={isLoading || !message.trim()} className="h-8">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                            {t('sending')}
                                        </>
                                    ) : (
                                        t('send')
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                )}
            </PopoverContent>
        </Popover>
    );
}
