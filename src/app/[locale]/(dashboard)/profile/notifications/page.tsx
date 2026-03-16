import type { Metadata } from "next";
import { ProfileNotificationsView } from "@/features/users/views/profile-notifications-view";

export const metadata: Metadata = {
    title: "Notificaciones | SEENCEL",
    robots: "noindex, nofollow",
};

export default async function ProfileNotificationsPage() {
    return <ProfileNotificationsView />;
}
