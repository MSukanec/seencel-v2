import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { getTranslations } from 'next-intl/server';
import { getUserProfile } from "@/features/profile/queries";
import { Shield, Lock, FileText, Database, Share2, Trash2, Mail, Building2, Scale, Zap } from "lucide-react";

export const metadata = {
    title: "Privacy Policy | Seencel",
    description: "Learn how we collect, use, and protect your data at Seencel.",
};

export default async function PrivacyPage() {
    const t = await getTranslations('Privacy');
    const { profile } = await getUserProfile().catch(() => ({ profile: null }));

    return (
        <div className="flex min-h-screen flex-col bg-background selection:bg-primary/10">
            <Header variant="public" user={profile} />

            <main className="flex-1">
                <div className="container px-4 md:px-6 mx-auto py-12 md:py-20 max-w-4xl">
                    {/* Header */}
                    <div className="mb-12 text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-balance">
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground text-lg mb-8">
                            {t('lastUpdated')}
                        </p>
                        <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
                            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-lg italic">
                                "{t('intro')}"
                            </p>
                        </div>
                    </div>

                    <div className="w-full h-px bg-border/50 mb-12" />

                    {/* Sections */}
                    <div className="space-y-16">

                        {/* 1. About */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Building2 className="h-6 w-6 text-primary" />
                                {t('about.title')}
                            </h2>
                            <p className="text-muted-foreground">{t('about.description')}</p>
                            <p className="text-muted-foreground">{t('about.services')}</p>
                        </section>

                        {/* 2. Applicability */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <FileText className="h-6 w-6 text-primary" />
                                {t('applicability.title')}
                            </h2>
                            <p className="text-muted-foreground">{t('applicability.description')}</p>
                        </section>

                        {/* 3. Collection */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Database className="h-6 w-6 text-primary" />
                                {t('collection.title')}
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6 mt-6">
                                <div className="bg-card border rounded-xl p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-foreground">{t('collection.direct.title')}</h3>
                                    <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                                        {['0', '1', '2', '3', '4', '5'].map(i => (
                                            <li key={i}>{t(`collection.direct.items.${i}`)}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-card border rounded-xl p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-foreground">{t('collection.automatic.title')}</h3>
                                    <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                                        {['0', '1', '2', '3'].map(i => (
                                            <li key={i}>{t(`collection.automatic.items.${i}`)}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 4. Google Data (Crucial for Compliance) */}
                        <section className="prose dark:prose-invert max-w-none">
                            <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900 rounded-2xl p-8">
                                <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-400">
                                    <Shield className="h-6 w-6" />
                                    {t('google.title')}
                                </h2>
                                <p className="text-lg font-medium text-blue-900 dark:text-blue-200 mt-4 mb-6">{t('google.description')}</p>

                                <ul className="space-y-3 mb-8">
                                    {['0', '1', '2'].map(i => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                            <span className="text-blue-800 dark:text-blue-300">{t(`google.items.${i}`)}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="bg-white dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900">
                                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium flex gap-2">
                                        <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                                        {t('google.disclaimer')}
                                    </p>
                                </div>
                                <p className="mt-4 text-xs text-blue-600/60 dark:text-blue-400/60">{t('google.maps')}</p>
                            </div>
                        </section>

                        {/* 5. Usage */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Zap className="h-6 w-6 text-primary" />
                                {t('usage.title')}
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4 mt-6">
                                {['0', '1', '2', '3'].map(i => (
                                    <div key={i} className="bg-muted/40 border border-border/50 p-4 rounded-lg text-sm text-muted-foreground hover:bg-muted/60 transition-colors">
                                        {t(`usage.items.${i}`)}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 6. Sharing */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Share2 className="h-6 w-6 text-primary" />
                                {t('sharing.title')}
                            </h2>
                            <p className="font-medium text-foreground mt-4">{t('sharing.policy')}</p>

                            <div className="flex flex-wrap gap-2 mt-6 mb-6">
                                {['0', '1', '2', '3', '4', '5', '6'].map(i => (
                                    <span key={i} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium border border-border/50">
                                        {t(`sharing.providers.${i}`)}
                                    </span>
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground italic border-l-2 border-primary/20 pl-4">{t('sharing.legal')}</p>
                        </section>

                        {/* 7. Security & Retention */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <section className="bg-card border rounded-xl p-6">
                                <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight mb-4">
                                    <Lock className="h-5 w-5 text-primary" />
                                    {t('security.title')}
                                </h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">{t('security.description')}</p>
                            </section>

                            <section className="bg-card border rounded-xl p-6">
                                <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight mb-4">
                                    <Trash2 className="h-5 w-5 text-primary" />
                                    {t('retention.title')}
                                </h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">{t('retention.description')}</p>
                            </section>
                        </div>

                        {/* 8. Rights */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Scale className="h-6 w-6 text-primary" />
                                {t('rights.title')}
                            </h2>
                            <p className="text-muted-foreground mt-4">{t('rights.description')}</p>
                        </section>

                        {/* 9. Contact */}
                        <section className="bg-gradient-to-b from-primary/5 to-transparent rounded-2xl p-12 text-center border border-primary/10">
                            <h2 className="flex items-center justify-center gap-3 text-2xl font-bold tracking-tight mb-4">
                                <Mail className="h-6 w-6 text-primary" />
                                {t('contact.title')}
                            </h2>
                            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">{t('contact.description')}</p>

                            <div className="flex justify-center gap-4">
                                <Button size="lg" className="rounded-full px-8" asChild>
                                    <a href="mailto:privacy@seencel.com">privacy@seencel.com</a>
                                </Button>
                            </div>
                        </section>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
