"use client";

import { ForumThread } from "@/actions/forum";
import { ForumThreadCard } from "./forum-thread-card";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";

interface ForumThreadListProps {
    threads: ForumThread[];
    onThreadSelect: (threadId: string) => void;
    onNewThread: () => void;
}

export function ForumThreadList({
    threads,
    onThreadSelect,
    onNewThread,
}: ForumThreadListProps) {
    const t = useTranslations("Forum");

    // Separate pinned and regular threads
    const pinnedThreads = threads.filter(t => t.is_pinned);
    const regularThreads = threads.filter(t => !t.is_pinned);

    if (threads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
                    <MessageSquarePlus className="h-10 w-10 text-primary/60" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t("emptyTitle")}</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                    {t("emptyDescription")}
                </p>
                <Button onClick={onNewThread} size="lg">
                    <MessageSquarePlus className="h-5 w-5 mr-2" />
                    {t("startDiscussion")}
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Pinned threads */}
            {pinnedThreads.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
                        {t("pinnedThreads")}
                    </h3>
                    <div className="space-y-2">
                        {pinnedThreads.map((thread) => (
                            <ForumThreadCard
                                key={thread.id}
                                thread={thread}
                                onClick={() => onThreadSelect(thread.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Regular threads */}
            <div className="space-y-3">
                {pinnedThreads.length > 0 && regularThreads.length > 0 && (
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
                        {t("allThreads")}
                    </h3>
                )}
                <div className="space-y-2">
                    {regularThreads.map((thread) => (
                        <ForumThreadCard
                            key={thread.id}
                            thread={thread}
                            onClick={() => onThreadSelect(thread.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

