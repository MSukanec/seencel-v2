import { LoginForm } from "./login-form";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Auth" });

    return {
        title: `${t("login.title")} | Seencel`,
        description: t("login.description"),
        robots: "index, follow",
        alternates: {
            canonical: `/login`,
        },
    };
}

export default function LoginPage() {
    return <LoginForm />;
}
