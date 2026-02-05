"use client";

import * as React from "react";
import { Bell, Check, Clock, MailOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { UserNotification } from "@/features/notifications/queries";
import { fetchUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/features/notifications/actions";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/stores/user-store";

// ============================================================================
// SIDEBAR NOTIFICATIONS BUTTON
// ============================================================================
// Expandable button for the left sidebar with notifications popover
// Shows: Bell Icon + "Notificaciones" + Badge count
// Popover opens above (like avatar button)
// ============================================================================

interface SidebarNotificationsButtonProps {
    isExpanded?: boolean;
    className?: string;
}

export function SidebarNotificationsButton({
    isExpanded = false,
    className
}: SidebarNotificationsButtonProps) {
    const t = useTranslations('Settings.Notifications');
    const locale = useLocale();
    const router = useRouter();
    const user = useUser();

    // State
    const [open, setOpen] = React.useState(false);
    const [notifications, setNotifications] = React.useState<UserNotification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [isPending, startTransition] = React.useTransition();

    const dateLocale = locale === 'es' ? es : enUS;

    // Calculate unread count & App Badge
    React.useEffect(() => {
        const count = notifications.filter(n => !n.read_at).length;
        setUnreadCount(count);

        // PWA App Badging API
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
                    schema: 'public',
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

    const buttonContent = (
        <button
            className={cn(
                "group relative flex items-center w-full rounded-lg transition-colors duration-0",
                "hover:bg-secondary/80 text-muted-foreground hover:text-foreground",
                "p-0 min-h-[32px]",
                open && "bg-secondary/50",
                className
            )}
        >
            {/* Icon with badge */}
            <div className={cn(
                "w-8 h-8 flex items-center justify-center shrink-0 relative",
                "text-muted-foreground group-hover:text-foreground"
            )}>
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-sidebar animate-pulse" />
                )}
            </div>

            {/* Label */}
            <span className={cn(
                "text-[13px] font-medium truncate transition-opacity duration-200 ease-in-out text-left",
                isExpanded ? "flex-1 opacity-100 ml-2" : "w-0 opacity-0 ml-0"
            )}>
                Notificaciones
            </span>

            {/* Unread count badge when expanded */}
            {isExpanded && unreadCount > 0 && (
                <span className="mr-2 px-1.5 py-0.5 text-[10px] font-semibold bg-red-600 text-white rounded-full">
                    {unreadCount}
                </span>
            )}
        </button>
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {buttonContent}
            </PopoverTrigger>

            <PopoverContent
                className="w-80 p-0"
                side="top"
                align="start"
                sideOffset={8}
            >
                <div className="flex items-center justify-between p-4 pb-2">
                    <h4 className="font-semibold leading-none">{t('title')}</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-0.5 text-xs text-muted-foreground hover:text-primary"
                            onClick={handleMarkAllRead}
                            disabled={isPending}
                        >
                            {t('markAllRead')}
                        </Button>
                    )}
                </div>
                <Separator />
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-3 opacity-20" />
                            <p className="text-xs">{t('empty')}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => {
                                const isRead = !!notification.read_at;
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => {
                                            if (notification.notification.data && typeof notification.notification.data === 'object' && 'url' in notification.notification.data) {
                                                const url = (notification.notification.data as any).url;
                                                if (typeof url === 'string') {
                                                    setOpen(false);
                                                    router.push(url as any);
                                                    if (!notification.read_at) handleMarkRead(notification.id);
                                                }
                                            }
                                        }}
                                        className={cn(
                                            "flex items-start gap-3 p-3 transition-colors hover:bg-muted/50 border-b last:border-0 cursor-pointer",
                                            !isRead && "bg-primary/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "mt-1 p-1.5 rounded-full shrink-0",
                                            isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                                        )}>
                                            {isRead ? <MailOpen className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                                        </div>
                                        <div className="flex-1 space-y-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn("text-sm font-medium leading-none truncate", isRead && "text-muted-foreground font-normal")}>
                                                    {notification.notification.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                                    {format(new Date(notification.delivered_at), 'dd MMM', { locale: dateLocale })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.notification.body}
                                            </p>
                                            {!isRead && (
                                                <div className="pt-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-[10px]"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMarkRead(notification.id);
                                                        }}
                                                    >
                                                        <Check className="mr-1 h-3 w-3" />
                                                        {t('markRead')}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t bg-muted/30">
                    <Button variant="ghost" className="w-full h-8 text-xs text-muted-foreground" onClick={() => {
                        setOpen(false);
                        router.push('/settings?tab=notifications' as any);
                    }}>
                        Ver todas
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

