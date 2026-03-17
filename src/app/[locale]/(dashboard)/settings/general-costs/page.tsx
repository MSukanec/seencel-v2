import type { Metadata } from "next";
import { GeneralCostsSettingsView } from "@/features/general-costs/views/general-costs-settings-view";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Ajustes de Gastos Generales | Seencel",
        robots: "noindex, nofollow",
    };
}

export default function GeneralCostsSettingsPage() {
    return <GeneralCostsSettingsView />;
}
