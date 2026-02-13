"use client";

// ============================================================================
// NOTIFICATIONS LIST VIEW
// ============================================================================
// Vista principal del historial de notificaciones.
// Toolbar con búsqueda + filtro + acción "Marcar todas".
// Lista con optimistic updates y realtime subscription.
// ============================================================================

import { useState, useEffect, useMemo, useTransition, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Bell, MailOpen, Check, CheckCheck, Filter } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { UserNotification } from "@/features/notifications/queries";
import {
    fetchUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from "@/features/notifications/actions";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/stores/user-store";
import { useRouter } from "@/i18n/routing";

// ── Filter type ──
type FilterMode = "all" | "unread" | "read";

interface NotificationsListViewProps {
    initialNotifications: UserNotification[];
    initialUnreadCount: number;
}

export function NotificationsListView({
    initialNotifications,
    initialUnreadCount,
}: NotificationsListViewProps) {
    const t = useTranslations("Settings.Notifications");
    const locale = useLocale();
    const router = useRouter();
    const user = useUser();
    const dateLocale = locale === "es" ? es : enUS;
    const [isPending, startTransition] = useTransition();

    // ── State ──
    const [notifications, setNotifications] = useState<UserNotification[]>(initialNotifications);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterMode, setFilterMode] = useState<FilterMode>("all");

    // ── Debounced search ──
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleSearchDebounced = useCallback((value: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(value);
        }, 300);
    }, []);

    const onSearchChange = (value: string) => {
        setSearchQuery(value);
        handleSearchDebounced(value);
    };

    // ── Computed ──
    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.read_at).length,
        [notifications]
    );

    const filteredNotifications = useMemo(() => {
        let items = notifications;

        // Filter by read status
        if (filterMode === "unread") {
            items = items.filter((n) => !n.read_at);
        } else if (filterMode === "read") {
            items = items.filter((n) => !!n.read_at);
        }

        // Filter by search
        if (debouncedSearch.trim()) {
            const search = debouncedSearch.toLowerCase();
            items = items.filter(
                (n) =>
                    n.notification.title.toLowerCase().includes(search) ||
                    (n.notification.body && n.notification.body.toLowerCase().includes(search))
            );
        }

        return items;
    }, [notifications, filterMode, debouncedSearch]);

    // ── Realtime subscription ──
    useEffect(() => {
        if (!user) return;

        const supabase = createClient();
        const channel = supabase
            .channel("notifications-page")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "user_notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                async () => {
                    const { notifications: fresh } = await fetchUserNotifications();
                    setNotifications(fresh);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // ── Actions ──
    const handleMarkRead = (id: string) => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) =>
                n.id === id ? { ...n, read_at: new Date().toISOString() } : n
            )
        );
        startTransition(async () => {
            await markNotificationAsRead(id);
        });
    };

    const handleMarkAllRead = () => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        );
        startTransition(async () => {
            await markAllNotificationsAsRead();
            toast.success(t("successAllRead"));
        });
    };

    const handleNotificationClick = (notification: UserNotification) => {
        // Mark as read if unread
        if (!notification.read_at) {
            handleMarkRead(notification.id);
        }

        // Navigate to URL if available
        if (
            notification.notification.data &&
            typeof notification.notification.data === "object" &&
            "url" in notification.notification.data
        ) {
            const url = (notification.notification.data as any).url;
            if (typeof url === "string") {
                router.push(url as any);
            }
        }
    };

    // ── Filter selector for toolbar leftActions ──
    const filterSelector = (
        <div className="flex items-center gap-2">
            {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                    {unreadCount} sin leer
                </Badge>
            )}
            <Select
                value={filterMode}
                onValueChange={(v) => setFilterMode(v as FilterMode)}
            >
                <SelectTrigger className="h-8 w-[140px] text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="unread">Sin leer</SelectItem>
                    <SelectItem value="read">Leídas</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );

    // ── Empty state: no notifications at all ──
    if (notifications.length === 0) {
        return (
            <>
                <Toolbar portalToHeader />
                <ViewEmptyState
                    mode="empty"
                    icon={Bell}
                    viewName="Notificaciones"
                    featureDescription="Las notificaciones te mantienen al día sobre la actividad de tus organizaciones, invitaciones, menciones y actualizaciones importantes."
                />
            </>
        );
    }

    // ── Empty state: no results from filters ──
    if (filteredNotifications.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    searchPlaceholder="Buscar notificaciones..."
                    leftActions={filterSelector}
                    actions={
                        unreadCount > 0
                            ? [
                                {
                                    label: "Marcar todas como leídas",
                                    icon: CheckCheck,
                                    onClick: handleMarkAllRead,
                                },
                            ]
                            : []
                    }
                />
                <ViewEmptyState
                    mode="no-results"
                    icon={Bell}
                    viewName="notificaciones"
                    filterContext={
                        filterMode === "unread"
                            ? "sin leer"
                            : filterMode === "read"
                                ? "leídas"
                                : "con esa búsqueda"
                    }
                    onResetFilters={() => {
                        setSearchQuery("");
                        setDebouncedSearch("");
                        setFilterMode("all");
                    }}
                />
            </>
        );
    }

    return (
        <>
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                searchPlaceholder="Buscar notificaciones..."
                leftActions={filterSelector}
                actions={
                    unreadCount > 0
                        ? [
                            {
                                label: "Marcar todas como leídas",
                                icon: CheckCheck,
                                onClick: handleMarkAllRead,
                            },
                        ]
                        : []
                }
            />
            <ContentLayout variant="narrow">
                <div className="max-w-3xl mx-auto">
                    <div className="rounded-xl border bg-card overflow-hidden divide-y">
                        {filteredNotifications.map((notification) => {
                            const isRead = !!notification.read_at;
                            const hasUrl =
                                notification.notification.data &&
                                typeof notification.notification.data === "object" &&
                                "url" in notification.notification.data;

                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={cn(
                                        "flex items-start gap-4 p-4 transition-colors",
                                        hasUrl && "cursor-pointer hover:bg-muted/50",
                                        !isRead && "bg-primary/5"
                                    )}
                                >
                                    {/* Icon */}
                                    <div
                                        className={cn(
                                            "mt-0.5 p-2 rounded-full shrink-0",
                                            isRead
                                                ? "bg-muted text-muted-foreground"
                                                : "bg-primary/10 text-primary"
                                        )}
                                    >
                                        {isRead ? (
                                            <MailOpen className="h-4 w-4" />
                                        ) : (
                                            <Bell className="h-4 w-4" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <p
                                                className={cn(
                                                    "text-sm leading-tight",
                                                    isRead
                                                        ? "text-muted-foreground"
                                                        : "font-medium text-foreground"
                                                )}
                                            >
                                                {notification.notification.title}
                                            </p>
                                            <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                                                {formatDistanceToNow(
                                                    new Date(notification.delivered_at),
                                                    {
                                                        addSuffix: true,
                                                        locale: dateLocale,
                                                    }
                                                )}
                                            </span>
                                        </div>

                                        {notification.notification.body && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.notification.body}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 pt-0.5">
                                            <span className="text-[10px] text-muted-foreground/60">
                                                {format(
                                                    new Date(notification.delivered_at),
                                                    "dd MMM yyyy, HH:mm",
                                                    { locale: dateLocale }
                                                )}
                                            </span>
                                            {!isRead && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 px-2 text-[10px] text-muted-foreground hover:text-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkRead(notification.id);
                                                    }}
                                                >
                                                    <Check className="mr-1 h-3 w-3" />
                                                    {t("markRead")}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </ContentLayout>
        </>
    );
}
