import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { getUserProfile } from "@/features/users/queries";
import { FoundersContent } from "@/features/founders/components/founders-content";

import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Founders" });

    return {
        title: `${t("hero.title")} | Seencel`,
        description: t("hero.subtitle"),
        alternates: {
            canonical: `/founders`,
        }
    };
}

export default async function FoundersPage() {
    const { profile } = await getUserProfile();

    return (
        <div className="flex min-h-screen flex-col">
            <Header variant="public" user={profile} />
            <main className="flex-1">
                <FoundersContent isDashboard={false} />
            </main>
            <Footer />
        </div>
    );
}
