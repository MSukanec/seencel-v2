"use client";

import * as React from "react";
import { Bell, BellRing, Check, Clock, Download, MailOpen, Share, Smartphone } from "lucide-react";
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
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { usePwaInstall } from "@/hooks/use-pwa-install";

interface NotificationsPopoverProps {
    initialNotifications?: UserNotification[];
}

export function NotificationsPopover({ initialNotifications = [] }: NotificationsPopoverProps) {
    const t = useTranslations('Settings.Notifications'); // Reuse existing translations
    const locale = useLocale();
    const router = useRouter();
    const user = useUser();

    // Push notifications & PWA install hooks
    const push = usePushNotifications();
    const pwa = usePwaInstall();

    // State
    const [open, setOpen] = React.useState(false);
    const [notifications, setNotifications] = React.useState<UserNotification[]>(initialNotifications);
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
                navigator.setAppBadge(count).catch((e) => console.error("Error setting badge", e));
            } else {
                navigator.clearAppBadge().catch((e) => console.error("Error clearing badge", e));
            }
        }
    }, [notifications]);

    // Initial Fetch & Realtime Subscription
    React.useEffect(() => {
        if (!user) return;

        // Fetch notifications when component mounts
        const refresh = async () => {
            const { notifications: fresh } = await fetchUserNotifications();
            setNotifications(fresh);
        };

        // CALL IMMEDIATELY ON MOUNT
        refresh();

        // Use Supabase Realtime
        const supabase = createClient();
        const channel = supabase
            .channel('notifications-popover')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'notifications',
                    table: 'user_notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    // New notification!
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
        // Optimistic update
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        ));

        startTransition(async () => {
            await markNotificationAsRead(id);
        });
    };

    const handleMarkAllRead = () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));

        startTransition(async () => {
            await markAllNotificationsAsRead();
            toast.success(t('successAllRead'));
        });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background animate-pulse" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" side="left" align="start" sideOffset={10}>
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

                {/* 🔔 Push activation banner */}
                {push.isSupported && !push.isSubscribed && push.permission !== 'denied' && pwa.isInstalled && (
                    <div className="p-3 bg-primary/5 border-b">
                        <div className="flex items-center gap-2 mb-2">
                            <BellRing className="h-4 w-4 text-primary" />
                            <p className="text-xs font-medium">Activar notificaciones</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-2">
                            Recibí alertas en tiempo real, incluso con la app cerrada.
                        </p>
                        <Button
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={async () => {
                                const ok = await push.subscribe();
                                if (ok) toast.success('Notificaciones push activadas');
                                else if (push.permission === 'denied') toast.error('Permiso denegado. Activalo desde la configuración del sistema.');
                            }}
                            disabled={push.isLoading}
                        >
                            {push.isLoading ? 'Activando...' : 'Activar push'}
                        </Button>
                    </div>
                )}

                {/* 📱 PWA install banner */}
                {!pwa.isInstalled && (
                    <div className="p-3 bg-accent/50 border-b">
                        <div className="flex items-center gap-2 mb-2">
                            <Smartphone className="h-4 w-4 text-primary" />
                            <p className="text-xs font-medium">Instalá Seencel</p>
                        </div>
                        {pwa.isIOS ? (
                            <>
                                <p className="text-[11px] text-muted-foreground mb-1">
                                    Para recibir notificaciones en iOS:
                                </p>
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <span>1. Tocá</span>
                                    <Share className="h-3 w-3 inline" />
                                    <span>2. &quot;Agregar a inicio&quot;</span>
                                </div>
                            </>
                        ) : pwa.isInstallable ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-7 text-xs"
                                onClick={() => pwa.promptInstall()}
                            >
                                <Download className="mr-1 h-3 w-3" />
                                Instalar app
                            </Button>
                        ) : (
                            <p className="text-[11px] text-muted-foreground">
                                Instalá la app desde el menú de tu navegador para recibir notificaciones push.
                            </p>
                        )}
                    </div>
                )}

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
                                            "flex items-start gap-3 p-3 transition-colors hover:bg-muted/50 border-b last:border-0 cursor-pointer", // Added cursor-pointer
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
                                                        onClick={() => handleMarkRead(notification.id)}
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
                        router.push('/profile?tab=notifications' as any);
                    }}>
                        Ver todas
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

