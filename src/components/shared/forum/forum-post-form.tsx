"use client";

import { useState } from "react";
import { createPost, ForumPost } from "@/actions/forum";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ForumPostFormProps {
    threadId: string;
    parentId?: string;
    onSuccess?: (post: ForumPost) => void;
    onCancel?: () => void;
}

export function ForumPostForm({
    threadId,
    parentId,
    onSuccess,
    onCancel,
}: ForumPostFormProps) {
    const t = useTranslations("Forum");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.error(t("contentRequired"));
            return;
        }

        setIsSubmitting(true);

        const result = await createPost(
            threadId,
            { html: content },
            parentId
        );

        setIsSubmitting(false);

        if (result.success && result.postId) {
            toast.success(t("postCreated"));
            setContent("");

            // Create a temporary post object for optimistic update
            const newPost: ForumPost = {
                id: result.postId,
                content: { html: content },
                is_accepted_answer: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                parent_id: parentId || null,
                author: {
                    id: "",
                    full_name: null,
                    avatar_url: null,
                },
            };

            onSuccess?.(newPost);
        } else {
            toast.error(result.error || t("postError"));
        }
    };

    return (
        <div className="relative group focus-within:ring-2 focus-within:ring-primary/20 rounded-md transition-all">
            <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder={t("replyPlaceholder")}
                disabled={isSubmitting}
                minHeight="100px"
                maxHeight="300px"
            />

            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                {onCancel && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="rounded-full shadow-sm px-4"
                    >
                        {t("cancel")}
                    </Button>
                )}
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !content.trim()}
                    size="icon"
                    className="rounded-full h-10 w-10 shadow-md transition-transform active:scale-95 hover:shadow-lg"
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4 ml-0.5" />
                    )}
                </Button>
            </div>
        </div>
    );
}

