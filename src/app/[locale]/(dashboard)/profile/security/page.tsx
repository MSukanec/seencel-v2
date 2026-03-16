import type { Metadata } from "next";
import { ProfileSecurityView } from "@/features/users/views/profile-security-view";

export const metadata: Metadata = {
    title: "Seguridad | SEENCEL",
    robots: "noindex, nofollow",
};

export default async function ProfileSecurityPage() {
    return <ProfileSecurityView />;
}
