"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { ForumThread, ForumCategory } from "@/actions/forum";
import { ForumThreadView } from "./forum-thread-view";
import { ForumThreadForm } from "./forum-thread-form";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Plus, ChevronLeft, ChevronRight, MessageSquare, Layers, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePanel } from "@/stores/panel-store";
import { cn } from "@/lib/utils";
import { useContextSidebar } from "@/stores/sidebar-store";
import { PageHeaderActionPortal } from "@/components/layout/dashboard/header/page-header";
import { ViewEmptyState } from "@/components/shared/empty-state";

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

type MobileView = "categories" | "threads" | "conversation";

export function ForumContainer({
    courseId,
    courseSlug,
    categories,
    threads: initialThreads,
    currentUserId,
}: ForumContainerProps) {
    const t = useTranslations("Forum");
    const { openPanel } = usePanel();
    const { setContent, clearContent } = useContextSidebar();
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

    // Mobile-specific view state
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
        openPanel('forum-thread-form', {
            courseId: courseId,
            categoryId: selectedCategoryId === "all" ? undefined : selectedCategoryId || undefined,
            categories: categories,
            onSuccess: (newThread: ForumThread) => {
                setThreads(prev => [newThread, ...prev]);
                setSelectedThreadId(newThread.id);
                setMobileView("conversation");
            }
        });
    };

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategoryId(categoryId);
        
        // Auto-select the first (most recent) thread in the new category
        const newFilteredThreads = categoryId === "all" 
            ? threads 
            : threads.filter(t => t.category_id === categoryId);
            
        if (newFilteredThreads.length > 0) {
            setSelectedThreadId(newFilteredThreads[0].id);
        } else {
            setSelectedThreadId(null);
        }
        
        setMobileView("threads");
    };

    const handleThreadSelect = (threadId: string) => {
        setSelectedThreadId(threadId);
        setMobileView("conversation");
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

    // === Mount Categories to Context Sidebar ===
    useEffect(() => {
        const sidebarContent = (
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-auto divide-y">
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
            </div>
        );

        setContent(sidebarContent, { title: t("categories") });
        return () => clearContent();
    }, [categories, selectedCategoryId, allThreadsCount, t, setContent, clearContent]);


    // Get mobile header title
    const getMobileTitle = () => {
        if (mobileView === "categories") return t("title");
        if (mobileView === "threads") {
            return selectedCategoryId === "all" ? t("allThreads") : selectedCategory?.name || t("threads");
        }
        return selectedThread?.title || t("title");
    };

    return (
        <Card variant="inset" className="flex-1 h-full min-h-[500px] flex flex-col pt-0">
            
            {/* Action Portal to put the New Thread Button in the main header */}
            <PageHeaderActionPortal>
                {!(selectedCategory?.is_read_only) && (
                    <Button onClick={handleNewThread} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        {t("newThread")}
                    </Button>
                )}
            </PageHeaderActionPortal>

            {/* Mobile Header - only visible on mobile */}
            <div className="md:hidden flex items-center justify-between p-4 border-b shrink-0 bg-transparent">
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

            {/* Desktop View (Threads | Conversation) */}
            <div className="flex-1 overflow-hidden flex">
                
                {/* Mobile: Categories fallback (when not pushed to sidebar on desktop) */}
                {mobileView === "categories" && (
                    <div className="md:hidden flex-1 overflow-auto divide-y bg-transparent">
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
                )}

                {/* LEFT COLUMN - Threads list */}
                <div
                    className={cn(
                        "h-full shrink-0",
                        "w-full md:w-[320px] lg:w-[380px] flex-col",
                        mobileView === "threads" ? "flex" : "hidden md:flex"
                    )}
                >
                    <div className="px-4 py-3 shrink-0">
                        <span className="font-medium text-sm text-foreground/80">
                            {selectedCategoryId === "all"
                                ? t("allThreads")
                                : selectedCategory?.name || t("threads")
                            }
                            <span className="text-muted-foreground ml-2">({filteredThreads.length})</span>
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-auto p-3">
                        {filteredThreads.length === 0 ? (
                            <div className="h-full">
                                <ViewEmptyState
                                    mode="empty"
                                    icon={MessageSquare}
                                    viewName={t("threads")}
                                    featureDescription={t("noThreads")}
                                    actionLabel={t("startDiscussion")}
                                    onAction={handleNewThread}
                                />
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

                {/* RIGHT COLUMN - Conversation View */}
                <div
                    className={cn(
                        "flex-1 h-full overflow-hidden bg-transparent",
                        mobileView === "conversation" ? "flex flex-col" : "hidden md:flex md:flex-col"
                    )}
                >
                    {selectedThread ? (
                        <ForumThreadView
                            thread={selectedThread}
                            currentUserId={currentUserId}
                            onThreadUpdate={handleThreadUpdate}
                        />
                    ) : (
                        <div className="h-full">
                            <ViewEmptyState
                                mode="empty"
                                icon={MessageSquare}
                                viewName={t("title")}
                                featureDescription={t("selectThreadToView")}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Card>
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
            <div className="w-8 h-8 rounded-md flex items-center justify-center text-primary-foreground bg-primary shrink-0 shadow-sm">
                <IconComponent className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn("font-medium text-sm truncate", selected && "text-primary")}>
                    {name}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium tracking-wider mt-0.5">
                    {threadCount || 0} {t("threads")}
                </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
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
    const pinnedThreads = threads.filter(t => t.is_pinned);
    const regularThreads = threads.filter(t => !t.is_pinned);

    return (
        <div className="flex flex-col gap-2 pb-2">
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
                "w-full text-left p-4 rounded-xl border transition-all outline-none",
                selected
                    ? "bg-primary/[0.04] border-primary/50 ring-1 ring-primary/50 shadow-sm relative z-10"
                    : "bg-card border-border/50 shadow-xs hover:bg-muted/30 hover:border-border/80",
                thread.is_pinned && !selected && "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
            )}
        >
            <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0 border border-border/50 shadow-sm">
                        <AvatarImage src={thread.author?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/5 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <p className={cn(
                            "font-medium text-[13px] leading-tight mb-1",
                            selected ? "text-foreground" : "text-foreground/80"
                        )}>
                            {thread.is_pinned && <span className="text-amber-500 mr-1 opacity-80 inline-flex items-center translate-y-[-1px]"><Rocket className="w-3.5 h-3.5"/></span>}
                            {thread.is_locked && <span className="text-muted-foreground mr-1 opacity-80 inline-flex items-center translate-y-[-1px]"><Layers className="w-3.5 h-3.5"/></span>}
                            <span className="line-clamp-2">{thread.title}</span>
                        </p>
                        <div className="flex items-center gap-x-2 gap-y-1 mt-1.5 flex-wrap">
                            <p className="text-[11px] text-muted-foreground/80 font-medium">
                                {authorName} · {thread.reply_count} res.
                            </p>
                            {showCategory && thread.category?.name && (
                                <span
                                    onClick={handleCategoryBadgeClick}
                                    className="text-[10px] px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors font-medium border border-primary/10"
                                >
                                    {thread.category.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </button>
    );
}

