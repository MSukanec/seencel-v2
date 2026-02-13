import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper } from "@/components/layout";
import { Bell } from "lucide-react";

// View
import { NotificationsListView } from "@/features/notifications/views/notifications-list-view";

// Queries
import { getUserNotifications, getUnreadNotificationsCount } from "@/features/notifications/queries";

// ✅ METADATA
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Settings.Notifications' });
    return {
        title: `${t('title')} | SEENCEL`,
        description: t('description'),
        robots: "noindex, nofollow",
    };
}

export default async function NotificationsPage() {
    // ✅ ERROR BOUNDARY
    try {
        // ✅ PARALLEL QUERIES
        const [notificationsData, unreadCount] = await Promise.all([
            getUserNotifications(),
            getUnreadNotificationsCount(),
        ]);

        const { notifications } = notificationsData;

        return (
            <PageWrapper
                type="page"
                title="Notificaciones"
                icon={<Bell />}
            >
                <NotificationsListView
                    initialNotifications={notifications}
                    initialUnreadCount={unreadCount}
                />
            </PageWrapper>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
