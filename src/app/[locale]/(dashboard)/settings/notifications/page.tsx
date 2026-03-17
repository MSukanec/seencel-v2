import type { Metadata } from "next";
import { ContentLayout } from "@/components/layout";
import { ProfileNotificationsView } from "@/features/users/views/profile-notifications-view";

export const metadata: Metadata = {
    title: "Notificaciones | SEENCEL",
    robots: "noindex, nofollow",
};

export default async function ProfileNotificationsPage() {
    return (
        <ContentLayout variant="narrow">
            <ProfileNotificationsView />
        </ContentLayout>
    );
}
