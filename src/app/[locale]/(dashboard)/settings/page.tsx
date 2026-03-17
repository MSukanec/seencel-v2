import { redirect } from "@/i18n/routing";

interface Props {
    params: Promise<{ locale: string }>;
}

export default async function SettingsRootPage({ params }: Props) {
    const { locale } = await params;
    redirect({ href: "/settings/profile", locale });
}
