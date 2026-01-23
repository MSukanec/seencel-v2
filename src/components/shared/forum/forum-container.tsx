"use client";

import { useState, useMemo } from "react";
import { ForumThread, ForumCategory } from "@/actions/forum";
import { ForumThreadView } from "./forum-thread-view";
import { ForumThreadForm } from "./forum-thread-form";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, ChevronLeft, ChevronRight, MessageSquare, Layers, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useModal } from "@/providers/modal-store";
import { cn } from "@/lib/utils";

interface ForumContainerProps {
    courseId: string;
    courseSlug: string;
    categories: ForumCategory[];
    threads: ForumThread[];
    currentUserId?: string;
}

// Icon map for categories
import {
    BookOpen,
    Code,
    Lightbulb,
    HelpCircle,
    Megaphone,
    Users,
    Palette,
    Wrench,
    FileText,
    Rocket,
    Star
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    MessageSquare,
    BookOpen,
    Code,
    Lightbulb,
    HelpCircle,
    Megaphone,
    Users,
    Palette,
    Wrench,
    Layers,
    FileText,
    Rocket,
    Star,
};

// Mobile view states: single column navigation
type MobileView = "categories" | "threads" | "conversation";

export function ForumContainer({
    courseId,
    courseSlug,
    categories,
    threads: initialThreads,
    currentUserId,
}: ForumContainerProps) {
    const t = useTranslations("Forum");
    const { openModal } = useModal();
    const [threads, setThreads] = useState(initialThreads);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>("all");

    // Pre-select the first thread (prioritize pinned threads)
    const getFirstThreadId = () => {
        const pinned = initialThreads.filter(t => t.is_pinned);
        const regular = initialThreads.filter(t => !t.is_pinned);
        const orderedThreads = [...pinned, ...regular];
        return orderedThreads[0]?.id || null;
    };
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(getFirstThreadId);

    // Mobile-specific view state - start on conversation if there's a thread
    const [mobileView, setMobileView] = useState<MobileView>(
        initialThreads.length > 0 ? "threads" : "categories"
    );

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const selectedThread = threads.find(t => t.id === selectedThreadId);

    // Filter threads by selected category (or show all)
    const filteredThreads = useMemo(() => {
        if (selectedCategoryId === "all" || !selectedCategoryId) {
            return threads;
        }
        return threads.filter(t => t.category_id === selectedCategoryId || t.category?.id === selectedCategoryId);
    }, [selectedCategoryId, threads]);

    const allThreadsCount = threads.length;

    const handleNewThread = () => {
        openModal(
            <ForumThreadForm
                courseId={courseId}
                categoryId={selectedCategoryId === "all" ? undefined : selectedCategoryId || undefined}
                onSuccess={(newThread: ForumThread) => {
                    setThreads(prev => [newThread, ...prev]);
                    setSelectedThreadId(newThread.id);
                    setMobileView("conversation");
                }}
            />,
            {
                title: t("newThread"),
                description: t("newThreadDescription"),
                size: "lg",
            }
        );
    };

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategoryId(categoryId);
        setSelectedThreadId(null);
        setMobileView("threads"); // Navigate to threads on mobile
    };

    const handleThreadSelect = (threadId: string) => {
        setSelectedThreadId(threadId);
        setMobileView("conversation"); // Navigate to conversation on mobile
    };

    const handleMobileBack = () => {
        if (mobileView === "conversation") {
            setMobileView("threads");
            setSelectedThreadId(null);
        } else if (mobileView === "threads") {
            setMobileView("categories");
        }
    };

    const handleThreadUpdate = (updatedThread: ForumThread) => {
        setThreads(prev =>
            prev.map(t => t.id === updatedThread.id ? updatedThread : t)
        );
    };

    // Get mobile header title
    const getMobileTitle = () => {
        if (mobileView === "categories") return t("title");
        if (mobileView === "threads") {
            return selectedCategoryId === "all" ? t("allThreads") : selectedCategory?.name || t("threads");
        }
        return selectedThread?.title || t("title");
    };

    return (
        <div className="h-full flex flex-col">
            {/* Mobile Header - only visible on mobile */}
            <div className="md:hidden flex items-center justify-between pb-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {mobileView !== "categories" && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleMobileBack}
                            className="-ml-2 shrink-0"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <h2 className="font-semibold truncate">{getMobileTitle()}</h2>
                </div>

                {mobileView !== "conversation" && !(selectedCategory?.is_read_only) && (
                    <Button onClick={handleNewThread} size="sm">
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Desktop Header - only visible on desktop */}
            <div className="hidden md:flex items-center justify-between pb-4">
                <h2 className="text-lg font-semibold">{t("title")}</h2>
                {!(selectedCategory?.is_read_only) && (
                    <Button onClick={handleNewThread} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        {t("newThread")}
                    </Button>
                )}
            </div>

            {/* Two-column layout (Desktop) */}
            <div className="flex-1 overflow-hidden flex">
                {/* LEFT COLUMN - Categories/Threads */}
                <div
                    className={cn(
                        "h-full border-r bg-muted/30 shrink-0 overflow-hidden",
                        "w-[27rem] lg:w-[30rem]",
                        // Mobile: show based on mobileView
                        mobileView === "categories" ? "flex md:flex w-full md:w-[27rem] lg:w-[30rem]" :
                            mobileView === "threads" ? "flex md:flex w-full md:w-[27rem] lg:w-[30rem]" :
                                "hidden md:flex"
                    )}
                >
                    <div className="w-full flex flex-col">
                        {/* Column Header - Desktop only */}
                        <div className="hidden md:block px-4 py-3 border-b">
                            <span className="font-medium text-sm">{t("categories")}</span>
                        </div>

                        {/* Mobile: Show categories OR threads based on mobileView */}
                        {/* Desktop: Always show categories */}
                        <div className="flex-1 overflow-auto">
                            {/* Categories - visible on desktop always, on mobile only when mobileView is categories */}
                            <div className={cn(
                                "divide-y",
                                mobileView !== "categories" && "hidden md:block"
                            )}>
                                {/* "All" Category */}
                                <CategoryItem
                                    id="all"
                                    name={t("allThreads")}
                                    threadCount={allThreadsCount}
                                    icon="Layers"
                                    selected={selectedCategoryId === "all"}
                                    onSelect={() => handleCategorySelect("all")}
                                />

                                {categories.map((category) => (
                                    <CategoryItem
                                        key={category.id}
                                        id={category.id}
                                        name={category.name}
                                        threadCount={category.thread_count}
                                        icon={category.icon || undefined}
                                        selected={selectedCategoryId === category.id}
                                        onSelect={() => handleCategorySelect(category.id)}
                                    />
                                ))}
                            </div>

                            {/* Threads - visible on mobile when mobileView is threads */}
                            <div className={cn(
                                mobileView !== "threads" && "hidden"
                            )}>
                                <ThreadList
                                    threads={filteredThreads}
                                    selectedId={selectedThreadId}
                                    onSelect={handleThreadSelect}
                                    showCategory={selectedCategoryId === "all"}
                                    onCategoryClick={handleCategorySelect}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - Threads list (desktop) or Conversation */}
                <div
                    className={cn(
                        "flex-1 h-full overflow-auto bg-background",
                        // Mobile: only show when mobileView is conversation
                        mobileView === "conversation" ? "flex w-full" : "hidden md:flex"
                    )}
                >
                    {/* Desktop: Show thread list in right column */}
                    <div className="hidden md:flex flex-col w-80 lg:w-96 shrink-0 border-r h-full bg-muted/30">
                        <div className="px-4 py-3 border-b">
                            <span className="font-medium text-sm">
                                {selectedCategoryId === "all"
                                    ? t("allThreads")
                                    : selectedCategory?.name || t("threads")
                                }
                                <span className="text-muted-foreground ml-2">({filteredThreads.length})</span>
                            </span>
                        </div>
                        <div className="flex-1 overflow-auto">
                            {filteredThreads.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground mb-4">{t("noThreads")}</p>
                                    <Button onClick={handleNewThread} variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t("startDiscussion")}
                                    </Button>
                                </div>
                            ) : (
                                <ThreadList
                                    threads={filteredThreads}
                                    selectedId={selectedThreadId}
                                    onSelect={handleThreadSelect}
                                    showCategory={selectedCategoryId === "all"}
                                    onCategoryClick={handleCategorySelect}
                                />
                            )}
                        </div>
                    </div>

                    {/* Conversation View */}
                    <div className="flex-1 h-full overflow-auto">
                        {selectedThread ? (
                            <ForumThreadView
                                thread={selectedThread}
                                currentUserId={currentUserId}
                                onThreadUpdate={handleThreadUpdate}
                            />
                        ) : (
                            <div className="hidden md:flex flex-col items-center justify-center h-full p-8 text-center">
                                <MessageSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground">{t("selectThreadToView")}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Category Item Component
function CategoryItem({
    id,
    name,
    threadCount,
    icon,
    selected,
    onSelect,
}: {
    id: string;
    name: string;
    threadCount?: number;
    icon?: string;
    selected: boolean;
    onSelect: () => void;
}) {
    const t = useTranslations("Forum");
    const IconComponent = icon && iconMap[icon] ? iconMap[icon] : MessageSquare;

    return (
        <button
            onClick={onSelect}
            className={cn(
                "w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3",
                selected && "bg-primary/10 border-l-2 border-l-primary"
            )}
        >
            <div className="w-8 h-8 rounded-md flex items-center justify-center text-primary-foreground bg-primary shrink-0">
                <IconComponent className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn("font-medium text-sm truncate", selected && "text-primary")}>
                    {name}
                </p>
                <p className="text-xs text-muted-foreground">
                    {threadCount || 0} {t("threads")}
                </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
    );
}

// Thread List Component  
function ThreadList({
    threads,
    selectedId,
    onSelect,
    showCategory = false,
    onCategoryClick,
}: {
    threads: ForumThread[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    showCategory?: boolean;
    onCategoryClick?: (categoryId: string) => void;
}) {
    // Separate pinned threads
    const pinnedThreads = threads.filter(t => t.is_pinned);
    const regularThreads = threads.filter(t => !t.is_pinned);

    return (
        <div className="divide-y">
            {pinnedThreads.map((thread) => (
                <ThreadItem
                    key={thread.id}
                    thread={thread}
                    selected={selectedId === thread.id}
                    onSelect={() => onSelect(thread.id)}
                    showCategory={showCategory}
                    onCategoryClick={onCategoryClick}
                />
            ))}
            {regularThreads.map((thread) => (
                <ThreadItem
                    key={thread.id}
                    thread={thread}
                    selected={selectedId === thread.id}
                    onSelect={() => onSelect(thread.id)}
                    showCategory={showCategory}
                    onCategoryClick={onCategoryClick}
                />
            ))}
        </div>
    );
}

// Thread Item Component
function ThreadItem({
    thread,
    selected,
    onSelect,
    showCategory = false,
    onCategoryClick,
}: {
    thread: ForumThread;
    selected: boolean;
    onSelect: () => void;
    showCategory?: boolean;
    onCategoryClick?: (categoryId: string) => void;
}) {
    const authorName = thread.author?.full_name || "Anónimo";
    const initials = thread.author?.full_name
        ? thread.author.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
        : "?";

    const handleCategoryBadgeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (thread.category?.id && onCategoryClick) {
            onCategoryClick(thread.category.id);
        }
    };

    return (
        <button
            onClick={onSelect}
            className={cn(
                "w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors",
                selected && "bg-primary/10 border-l-2 border-l-primary",
                thread.is_pinned && "bg-amber-500/5"
            )}
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={thread.author?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <p className={cn(
                        "font-medium text-sm line-clamp-2",
                        selected && "text-primary"
                    )}>
                        {thread.is_pinned && <span className="text-amber-500 mr-1">📌</span>}
                        {thread.is_locked && <span className="text-muted-foreground mr-1">🔒</span>}
                        {thread.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-xs text-muted-foreground">
                            {authorName} · {thread.reply_count} respuestas
                        </p>
                        {showCategory && thread.category?.name && (
                            <span
                                onClick={handleCategoryBadgeClick}
                                className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer transition-colors"
                            >
                                {thread.category.name}
                            </span>
                        )}
                    </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
            </div>
        </button>
    );
}

