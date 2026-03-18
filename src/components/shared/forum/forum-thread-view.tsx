"use client";

import { useState, useEffect } from "react";
import { ForumThread, ForumPost, getThreadById, markAsAnswer } from "@/actions/forum";
import { ForumPostItem } from "./forum-post-item";
import { ForumPostForm } from "./forum-post-form";
import { RichTextRenderer } from "@/components/shared/rich-text-editor";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Pin,
    Lock,
    MessageSquare,
    Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ForumThreadViewProps {
    thread: ForumThread;
    currentUserId?: string;
    onThreadUpdate?: (thread: ForumThread) => void;
}

export function ForumThreadView({
    thread,
    currentUserId,
    onThreadUpdate,
}: ForumThreadViewProps) {
    const t = useTranslations("Forum");
    const locale = useLocale();
    const dateLocale = locale === "es" ? es : enUS;

    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const authorName = thread.author?.full_name || t("anonymous");

    const initials = thread.author?.full_name
        ? thread.author.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
        : "?";

    const createdAt = formatDistanceToNow(new Date(thread.created_at), {
        addSuffix: true,
        locale: dateLocale,
    });

    // Load posts
    useEffect(() => {
        async function loadPosts() {
            setIsLoading(true);
            const result = await getThreadById(thread.id);
            setPosts(result.posts);
            setIsLoading(false);
        }
        loadPosts();
    }, [thread.id]);

    const handleNewPost = (newPost: ForumPost) => {
        setPosts(prev => [...prev, newPost]);
        // Update reply count
        if (onThreadUpdate) {
            onThreadUpdate({
                ...thread,
                reply_count: thread.reply_count + 1,
                last_activity_at: new Date().toISOString(),
            });
        }
    };

    const handlePostDelete = (postId: string) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
        if (onThreadUpdate) {
            onThreadUpdate({
                ...thread,
                reply_count: Math.max(0, thread.reply_count - 1),
            });
        }
    };

    const handleMarkAsAnswer = async (postId: string) => {
        const result = await markAsAnswer(postId);
        if (result.success) {
            setPosts(prev => prev.map(p => ({
                ...p,
                is_accepted_answer: p.id === postId,
            })));
            toast.success(t("answerMarked"));
        } else {
            toast.error(result.error);
        }
    };

    const isThreadAuthor = currentUserId === thread.author?.id;

    return (
        <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
            {/* Original Post */}
            <Card variant="island" className="p-4 md:p-6">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-4">
                    {thread.is_pinned && (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                            <Pin className="h-3 w-3 mr-1" />
                            {t("pinned")}
                        </Badge>
                    )}
                    {thread.is_locked && (
                        <Badge variant="secondary" className="bg-muted">
                            <Lock className="h-3 w-3 mr-1" />
                            {t("locked")}
                        </Badge>
                    )}
                </div>

                {/* Author header */}
                <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={thread.author?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{authorName}</p>
                        <p className="text-sm text-muted-foreground">{createdAt}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="prose prose-sm max-w-none dark:prose-invert text-[14px] [&>*:first-child]:mt-0">
                    <RichTextRenderer
                        content={thread.content}
                    />
                </div>
            </Card>

            <Separator />

            {/* Replies section */}
            <div className="space-y-6">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {t("replies")}
                    <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] font-medium h-auto leading-none">
                        {posts.length}
                    </Badge>
                </h3>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {posts.length > 0 && (
                            <div className="space-y-4">
                                {posts.map((post) => (
                                    <ForumPostItem
                                        key={post.id}
                                        post={post}
                                        currentUserId={currentUserId}
                                        isThreadAuthor={isThreadAuthor}
                                        onDelete={handlePostDelete}
                                        onMarkAsAnswer={handleMarkAsAnswer}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Reply form */}
                        {!thread.is_locked && (
                            <div className={cn(posts.length > 0 && "pt-6 border-t")}>
                                <h3 className="text-sm font-semibold mb-3">{t("writeReply")}</h3>
                                <ForumPostForm
                                    threadId={thread.id}
                                    onSuccess={handleNewPost}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

