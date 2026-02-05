"use client";

import { useState } from "react";
import { createThread, ForumThread } from "@/actions/forum";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useModal } from "@/stores/modal-store";

interface ForumThreadFormProps {
    courseId: string;
    categoryId?: string;
    onSuccess?: (thread: ForumThread) => void;
}

export function ForumThreadForm({
    courseId,
    categoryId,
    onSuccess,
}: ForumThreadFormProps) {
    const t = useTranslations("Forum");
    const { closeModal } = useModal();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error(t("titleRequired"));
            return;
        }

        if (!content.trim()) {
            toast.error(t("contentRequired"));
            return;
        }

        setIsSubmitting(true);

        const result = await createThread(
            courseId,
            title.trim(),
            { html: content }
        );

        setIsSubmitting(false);

        if (result.success && result.threadId) {
            toast.success(t("threadCreated"));
            closeModal();

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

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="thread-title">{t("threadTitle")}</Label>
                <Input
                    id="thread-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("threadTitlePlaceholder")}
                    disabled={isSubmitting}
                    autoFocus
                />
            </div>

            <div className="space-y-2">
                <Label>{t("threadContent")}</Label>
                <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder={t("threadContentPlaceholder")}
                    disabled={isSubmitting}
                    minHeight="150px"
                    maxHeight="400px"
                />
            </div>

            <FormFooter
                isLoading={isSubmitting}
                submitLabel={t("createThread")}
                onCancel={closeModal}
                onSubmit={handleSubmit}
            />
        </div>
    );
}

