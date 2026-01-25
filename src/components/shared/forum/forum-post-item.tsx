"use client";

import { ForumPost, updatePost, deletePost } from "@/actions/forum";
import { RichTextRenderer } from "@/components/shared/rich-text-editor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    CheckCircle2,
    MoreHorizontal,
    Pencil,
    Trash2,
    Award
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/shared/forms/general/delete-dialog";
import { cn } from "@/lib/utils";

interface ForumPostItemProps {
    post: ForumPost;
    currentUserId?: string;
    isThreadAuthor?: boolean;
    onDelete?: (postId: string) => void;
    onMarkAsAnswer?: (postId: string) => void;
}

export function ForumPostItem({
    post,
    currentUserId,
    isThreadAuthor = false,
    onDelete,
    onMarkAsAnswer,
}: ForumPostItemProps) {
    const t = useTranslations("Forum");
    const locale = useLocale();
    const dateLocale = locale === "es" ? es : enUS;

    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const authorName = post.author?.full_name || t("anonymous");

    const initials = post.author?.full_name
        ? post.author.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
        : "?";

    const createdAt = formatDistanceToNow(new Date(post.created_at), {
        addSuffix: true,
        locale: dateLocale,
    });

    const isAuthor = currentUserId === post.author?.id;
    const canMarkAsAnswer = isThreadAuthor && !post.is_accepted_answer && !isAuthor;

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deletePost(post.id);
        setIsDeleting(false);
        setShowDeleteDialog(false);

        if (result.success) {
            toast.success(t("postDeleted"));
            onDelete?.(post.id);
        } else {
            toast.error(result.error);
        }
    };

    return (
        <>
            <div className={cn(
                "bg-card rounded-lg border p-4",
                post.is_accepted_answer && "border-green-500/50 bg-green-500/5"
            )}>
                {/* Accepted answer badge */}
                {post.is_accepted_answer && (
                    <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {t("acceptedAnswer")}
                        </Badge>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={post.author?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium">{authorName}</p>
                            <p className="text-xs text-muted-foreground">{createdAt}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    {(isAuthor || canMarkAsAnswer) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {canMarkAsAnswer && (
                                    <DropdownMenuItem onClick={() => onMarkAsAnswer?.(post.id)}>
                                        <Award className="h-4 w-4 mr-2" />
                                        {t("markAsAnswer")}
                                    </DropdownMenuItem>
                                )}
                                {isAuthor && (
                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {t("deletePost")}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Content */}
                <RichTextRenderer content={post.content} />
            </div>

            <DeleteDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
                title={t("deletePostTitle")}
                description={t("deletePostDescription")}
            />
        </>
    );
}

