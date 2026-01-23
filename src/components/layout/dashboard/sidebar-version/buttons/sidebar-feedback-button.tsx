"use client";

import * as React from "react";
import { MessageSquare, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { submitFeedback } from "@/actions/submit-feedback";

// ============================================================================
// SIDEBAR FEEDBACK BUTTON
// ============================================================================
// Expandable button for the left sidebar with feedback popover
// Shows: MessageSquare Icon + "Feedback"
// Popover opens above (like avatar/notifications buttons)
// ============================================================================

interface SidebarFeedbackButtonProps {
    isExpanded?: boolean;
    className?: string;
}

export function SidebarFeedbackButton({
    isExpanded = false,
    className
}: SidebarFeedbackButtonProps) {
    const t = useTranslations('Feedback');
    const [open, setOpen] = React.useState(false);
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
            setTimeout(() => {
                setOpen(false);
                setIsSuccess(false);
            }, 1500);
        } else {
            console.error(result.error);
        }
    };

    const buttonContent = (
        <button
            className={cn(
                "group relative flex items-center w-full rounded-lg transition-all duration-200",
                "hover:bg-secondary/80 text-muted-foreground hover:text-foreground",
                "p-0 min-h-[32px]",
                open && "bg-secondary/50",
                className
            )}
        >
            {/* Icon */}
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <MessageSquare className="h-4 w-4" />
            </div>

            {/* Label */}
            <span className={cn(
                "text-[13px] font-medium truncate transition-all duration-150 ease-in-out text-left",
                isExpanded ? "flex-1 opacity-100 ml-2" : "w-0 opacity-0 ml-0"
            )}>
                Feedback
            </span>
        </button>
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {buttonContent}
            </PopoverTrigger>

            <PopoverContent
                className="w-80 p-0"
                side="top"
                align="start"
                sideOffset={8}
            >
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
                            <div className="flex items-center justify-end">
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

