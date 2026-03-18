"use client";

import { useState, useEffect } from "react";
import { createThread, ForumThread, ForumCategory } from "@/actions/forum";
import { SelectField, TextField, RichTextField } from "@/components/shared/forms/fields";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { usePanel } from "@/stores/panel-store";
import { MessageSquare } from "lucide-react";

interface ForumThreadFormProps {
    courseId: string;
    categoryId?: string;
    categories?: ForumCategory[];
    onSuccess?: (thread: ForumThread) => void;
}

export function ForumThreadForm({
    courseId,
    categoryId,
    categories = [],
    onSuccess,
    formId,
}: ForumThreadFormProps & { formId?: string }) {
    const t = useTranslations("Forum");
    const { closePanel, setPanelMeta, setSubmitting } = usePanel();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>(categoryId || "");

    useEffect(() => {
        setPanelMeta({
            title: t("newThread"),
            description: t("newThreadDescription"),
            icon: MessageSquare,
            footer: {
                submitLabel: t("createThread")
            }
        });
    }, [setPanelMeta, t]);

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error(t("titleRequired"));
            return;
        }

        if (!content.trim()) {
            toast.error(t("contentRequired"));
            return;
        }

        setSubmitting(true);

        const result = await createThread(
            courseId,
            title.trim(),
            { html: content },
            selectedCategory || undefined
        );

        setSubmitting(false);

        if (result.success && result.threadId) {
            toast.success(t("threadCreated"));
            closePanel();

            // Create a temporary thread object for optimistic update
            const newThread: ForumThread = {
                id: result.threadId,
                title: title.trim(),
                slug: "",
                content: { html: content },
                view_count: 0,
                reply_count: 0,
                is_pinned: false,
                is_locked: false,
                created_at: new Date().toISOString(),
                last_activity_at: new Date().toISOString(),
                author: {
                    id: "",
                    full_name: null,
                    avatar_url: null,
                },
            };

            onSuccess?.(newThread);
        } else {
            toast.error(result.error || t("threadError"));
        }
    };

    const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

    return (
        <form id={formId} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
            {categories.length > 0 && (
                <SelectField
                    label={t("categories")}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={categoryOptions}
                    placeholder={t("categories")}
                />
            )}

            <TextField
                label={t("threadTitle")}
                value={title}
                onChange={setTitle}
                placeholder={t("threadTitlePlaceholder")}
                autoFocus
            />

            <RichTextField
                label={t("threadContent")}
                value={content}
                onChange={setContent}
                placeholder={t("threadContentPlaceholder")}
                minHeight="150px"
                maxHeight="400px"
            />
        </form>
    );
}

