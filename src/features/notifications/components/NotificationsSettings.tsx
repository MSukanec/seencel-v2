"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "next-intl";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { markAllNotificationsAsRead, markNotificationAsRead } from "@/features/notifications/actions";
import { UserNotification } from "@/features/notifications/queries";
import { Bell, Check, MailOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

interface NotificationsSettingsProps {
    initialNotifications: UserNotification[];
}

export function NotificationsSettings({ initialNotifications }: NotificationsSettingsProps) {
    const t = useTranslations('Settings.Notifications');
    const locale = useLocale();
    const [isPending, startTransition] = useTransition();
    const [notifications, setNotifications] = useState<UserNotification[]>(initialNotifications);

    const handleMarkAllRead = () => {
        startTransition(async () => {
            const result = await markAllNotificationsAsRead();
            if (result.success) {
                setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
                toast.success(t('successAllRead'));
            } else {
                toast.error(t('error'));
            }
        });
    };

    const handleMarkRead = (id: string) => {
        startTransition(async () => {
            const result = await markNotificationAsRead(id);
            if (result.success) {
                setNotifications(prev => prev.map(n =>
                    n.id === id ? { ...n, read_at: new Date().toISOString() } : n
                ));
            } else {
                toast.error(t('error'));
            }
        });
    };

    const dateLocale = locale === 'es' ? es : enUS;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                    <CardTitle>{t('title')}</CardTitle>
                    <CardDescription>{t('description')}</CardDescription>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllRead}
                    disabled={isPending || notifications.every(n => n.read_at)}
                >
                    <Check className="mr-2 h-4 w-4" />
                    {t('markAllRead')}
                </Button>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <Bell className="h-10 w-10 mb-4 opacity-20" />
                            <p className="text-sm border rounded-full px-4 py-1.5 bg-muted/50">{t('empty')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((notification) => {
                                const isRead = !!notification.read_at;
                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                                            isRead ? "bg-muted/30 border-transparent" : "bg-card border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "mt-1 p-2 rounded-full",
                                            isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                                        )}>
                                            {isRead ? <MailOpen className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className={cn("font-medium text-sm", isRead && "text-muted-foreground")}>
                                                    {notification.notification.title}
                                                </p>
                                                <div className="flex items-center text-xs text-muted-foreground gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(notification.delivered_at), 'dd MMM, HH:mm', { locale: dateLocale })}
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {notification.notification.body}
                                            </p>
                                        </div>
                                        {!isRead && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground hover:text-foreground"
                                                onClick={() => handleMarkRead(notification.id)}
                                                disabled={isPending}
                                                title={t('markRead')}
                                            >
                                                <Check className="h-4 w-4" />
                                                <span className="sr-only">{t('markRead')}</span>
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

