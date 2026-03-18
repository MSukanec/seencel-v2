"use client";

import * as React from "react";
import { Bell, Check, MailOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { UserNotification } from "@/features/notifications/queries";
import { fetchUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/features/notifications/actions";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/stores/user-store";

// ============================================================================
// NOTIFICATIONS POPOVER — Content + Logic
// ============================================================================
// Contains: real-time subscription, mark read, PWA badge, notification list.
// Used by: SidebarNotificationsButton (composes trigger + this popover).
// ============================================================================

/**
 * Hook that manages notifications state, real-time subscription, and PWA badge.
 * Extracted so the button component can access unreadCount for badges.
 */
export function useNotifications() {
    const user = useUser();
    const t = useTranslations('Settings.Notifications');

    const [notifications, setNotifications] = React.useState<UserNotification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [isPending, startTransition] = React.useTransition();

    // Calculate unread count & App Badge
    React.useEffect(() => {
        const count = notifications.filter(n => !n.read_at).length;
        setUnreadCount(count);

        if ('setAppBadge' in navigator) {
            if (count > 0) {
                (navigator as any).setAppBadge(count).catch((e: any) => console.error("Error setting badge", e));
            } else {
                (navigator as any).clearAppBadge().catch((e: any) => console.error("Error clearing badge", e));
            }
        }
    }, [notifications]);

    // Initial Fetch & Realtime Subscription
    React.useEffect(() => {
        if (!user) return;

        const refresh = async () => {
            const { notifications: fresh } = await fetchUserNotifications();
            setNotifications(fresh);
        };

        refresh();

        const supabase = createClient();
        const channel = supabase
            .channel('notifications-sidebar')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'notifications',
                    table: 'user_notifications',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    toast.info(t('newNotification'));
                    refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, t]);

    const handleMarkRead = (id: string) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        ));
        startTransition(async () => {
            await markNotificationAsRead(id);
        });
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
        startTransition(async () => {
            await markAllNotificationsAsRead();
            toast.success(t('successAllRead'));
        });
    };

    return { notifications, unreadCount, isPending, handleMarkRead, handleMarkAllRead };
}

/**
 * Notifications popover content — renders inside a PopoverContent.
 */
interface NotificationsPopoverProps {
    notifications: UserNotification[];
    unreadCount: number;
    isPending: boolean;
    onMarkRead: (id: string) => void;
    onMarkAllRead: () => void;
    onClose: () => void;
}

export function NotificationsPopover({
    notifications,
    unreadCount,
    isPending,
    onMarkRead,
    onMarkAllRead,
    onClose,
}: NotificationsPopoverProps) {
    const t = useTranslations('Settings.Notifications');
    const locale = useLocale();
    const router = useRouter();
    const dateLocale = locale === 'es' ? es : enUS;

    const handleClick = (notification: UserNotification) => {
        const data = notification.notification.data;
        if (data && typeof data === 'object' && 'url' in data) {
            const url = (data as any).url;
            if (typeof url === 'string') {
                onClose();
                router.push(url as any);
                if (!notification.read_at) onMarkRead(notification.id);
            }
        }
    };

    return (
        <div className="flex flex-col max-h-[320px]">
            {/* Header — compact, fixed */}
            <div className="flex items-center justify-between px-3 py-2 shrink-0">
                <span className="font-semibold text-xs">{t('title')}</span>
                {unreadCount > 0 && (
                    <button
                        onClick={onMarkAllRead}
                        disabled={isPending}
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                    >
                        {t('markAllRead')}
                    </button>
                )}
            </div>
            <Separator />

            {/* Notification list — scrollable */}
            <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                        <Bell className="h-5 w-5 mb-2 opacity-20" />
                        <p className="text-[11px]">{t('empty')}</p>
                    </div>
                ) : (
                    <div className="p-1">
                        {notifications.map((notification) => {
                            const isRead = !!notification.read_at;
                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => handleClick(notification)}
                                    className={cn(
                                        "flex items-start gap-2 px-2 py-1.5 rounded-md transition-colors hover:bg-secondary cursor-pointer",
                                        !isRead && "bg-primary/5"
                                    )}
                                >
                                    <div className={cn(
                                        "mt-0.5 p-1 rounded-full shrink-0",
                                        isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                                    )}>
                                        {isRead ? <MailOpen className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                        <div className="flex items-start justify-between gap-1">
                                            <p className={cn("text-xs font-medium leading-tight truncate", isRead && "text-muted-foreground font-normal")}>
                                                {notification.notification.title}
                                            </p>
                                            <span className="text-[9px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                                                {format(new Date(notification.delivered_at), 'dd MMM', { locale: dateLocale })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                                            {notification.notification.body}
                                        </p>
                                        {!isRead && (
                                            <button
                                                className="flex items-center text-[10px] text-muted-foreground hover:text-primary transition-colors mt-0.5"
                                                onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
                                            >
                                                <Check className="mr-0.5 h-2.5 w-2.5" />
                                                {t('markRead')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer — fixed */}
            <div className="border-t p-1 shrink-0">
                <button
                    onClick={() => { onClose(); router.push('/notifications' as any); }}
                    className="flex items-center justify-center w-full px-2 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                    Ver todas
                </button>
            </div>
        </div>
    );
}
