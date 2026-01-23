"use client";

import { ForumThread } from "@/actions/forum";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    MessageSquare,
    Eye,
    Pin,
    Lock,
    CheckCircle2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ForumThreadCardProps {
    thread: ForumThread;
    onClick: () => void;
}

export function ForumThreadCard({ thread, onClick }: ForumThreadCardProps) {
    const locale = useLocale();
    const t = useTranslations("Forum");
    const dateLocale = locale === "es" ? es : enUS;

    const authorName = thread.author?.full_name || t("anonymous");

    const initials = thread.author?.full_name
        ? thread.author.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
        : "?";

    const timeAgo = formatDistanceToNow(new Date(thread.last_activity_at), {
        addSuffix: true,
        locale: dateLocale,
    });

    return (
        <Card
            className={cn(
                "group cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
                thread.is_pinned && "border-amber-500/30 bg-amber-500/5"
            )}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex gap-4">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={thread.author?.avatar_url || undefined} />
                        <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                {/* Title with badges */}
                                <div className="flex items-center gap-2 mb-1">
                                    {thread.is_pinned && (
                                        <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    )}
                                    {thread.is_locked && (
                                        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    )}
                                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                        {thread.title}
                                    </h3>
                                </div>

                                {/* Author and time */}
                                <p className="text-sm text-muted-foreground">
                                    {authorName} · {timeAgo}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-muted-foreground shrink-0">
                                <div className="flex items-center gap-1.5 text-sm">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>{thread.reply_count}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm">
                                    <Eye className="h-4 w-4" />
                                    <span>{thread.view_count}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

