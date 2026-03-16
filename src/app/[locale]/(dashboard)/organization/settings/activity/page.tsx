import type { Metadata } from "next";
import { TeamActivityView } from "@/features/team/views/team-activity-view";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Actividad | Seencel",
        description: "Registro de actividad de la organización",
        robots: "noindex, nofollow",
    };
}

import { ContentLayout } from "@/components/layout";

export default function SettingsActivityPage() {
    return (
        <ContentLayout variant="settings">
            <TeamActivityView />
        </ContentLayout>
    );
}
