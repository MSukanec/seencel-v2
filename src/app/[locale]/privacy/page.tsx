import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { getMessages } from 'next-intl/server';
import { getUserProfile } from "@/features/profile/queries";
import { Shield, Lock, FileText, Database, Share2, Trash2, Mail, Building2, Scale, Zap, Info, CheckCircle2, Globe, Server } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Privacy Policy | Seencel",
    description: "Learn how we collect, use, and protect your data at Seencel.",
};

export default async function PrivacyPage() {
    const messages = await getMessages();
    const privacy = (messages as any).Privacy;
    const s = privacy.sections;

    // Helper to get array from object or array
    const getList = (items: any) => Array.isArray(items) ? items : [];

    const { profile } = await getUserProfile().catch(() => ({ profile: null }));

    return (
        <div className="flex min-h-screen flex-col bg-background selection:bg-primary/10">
            <Header variant="public" user={profile} />

            <main className="flex-1">
                <div className="container px-4 md:px-6 mx-auto py-12 md:py-20 max-w-4xl">
                    {/* Header */}
                    <div className="mb-12 text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-balance">
                            {privacy.title}
                        </h1>
                        <p className="text-muted-foreground text-lg mb-8">
                            {privacy.lastUpdated}
                        </p>
                        <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
                            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-lg italic">
                                "{privacy.intro}"
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
                                {s.about.title}
                            </h2>
                            <p className="text-muted-foreground mt-4 leading-relaxed">{s.about.description}</p>
                            <div className="mt-4">
                                <p className="font-semibold mb-2">{s.about.listTitle}</p>
                                <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-2 list-none pl-0">
                                    {getList(s.about.items).map((item: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* 2. Applicability */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <FileText className="h-6 w-6 text-primary" />
                                {s.applicability.title}
                            </h2>
                            <p className="text-muted-foreground mt-4">{s.applicability.description}</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                                {getList(s.applicability.items).map((item: string, i: number) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </section>

                        {/* 3. Collection */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Database className="h-6 w-6 text-primary" />
                                {s.collection.title}
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6 mt-6">
                                <div className="bg-card border rounded-xl p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                                        <Info className="h-4 w-4" />
                                        {s.collection.direct.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">{s.collection.direct.description}</p>
                                    <ul className="space-y-3">
                                        {getList(s.collection.direct.items).map((item: string, i: number) => (
                                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-card border rounded-xl p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                                        <Server className="h-4 w-4" />
                                        {s.collection.automatic.title}
                                    </h3>
                                    <ul className="space-y-3">
                                        {getList(s.collection.automatic.items).map((item: string, i: number) => (
                                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Google Compliance Section */}
                            <div className="mt-8 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-8">
                                <h3 className="flex items-center gap-3 text-xl font-bold text-blue-700 dark:text-blue-400">
                                    <Shield className="h-6 w-6" />
                                    {s.collection.google.title}
                                </h3>
                                <p className="text-blue-900 dark:text-blue-200 mt-4 mb-6 font-medium">
                                    {s.collection.google.description}
                                </p>

                                <ul className="grid sm:grid-cols-3 gap-4 mb-8">
                                    {getList(s.collection.google.items).map((item: string, i: number) => (
                                        <li key={i} className="bg-white dark:bg-blue-900/40 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200 shadow-sm">
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex gap-4 items-start bg-blue-100/50 dark:bg-blue-900/40 p-4 rounded-xl border border-blue-200 dark:border-blue-700/50">
                                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                        {s.collection.google.disclaimer}
                                    </p>
                                </div>

                                <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
                                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">{s.collection.google.mapsDescription}</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {getList(s.collection.google.mapsItems).map((item: string, i: number) => (
                                            <li key={i} className="text-sm text-blue-700 dark:text-blue-400">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 4. Usage */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Zap className="h-6 w-6 text-primary" />
                                {s.usage.title}
                            </h2>
                            <p className="text-muted-foreground mt-4 mb-6">{s.usage.description}</p>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {getList(s.usage.subsections).map((sub: any, i: number) => (
                                    <div key={i} className="bg-muted/40 border border-border/50 p-5 rounded-lg hover:bg-muted/60 transition-colors">
                                        <h3 className="font-semibold mb-3 text-foreground">{sub.title}</h3>
                                        <ul className="space-y-2">
                                            {getList(sub.items).map((item: string, j: number) => (
                                                <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                                    <div className="mt-1.5 h-1 w-1 rounded-full bg-primary/50 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 5. Sharing */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Share2 className="h-6 w-6 text-primary" />
                                {s.sharing.title}
                            </h2>
                            <p className="font-medium text-foreground mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                                {s.sharing.generalPolicy}
                            </p>

                            <div className="mt-8 space-y-8">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">{s.sharing.providers.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">{s.sharing.providers.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {getList(s.sharing.providers.items).map((item: string, i: number) => (
                                            <span key={i} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium border border-border/50">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="bg-card p-4 rounded-lg border">
                                        <h3 className="font-semibold mb-2">{s.sharing.organization.title}</h3>
                                        <p className="text-sm text-muted-foreground">{s.sharing.organization.description}</p>
                                    </div>
                                    <div className="bg-card p-4 rounded-lg border">
                                        <h3 className="font-semibold mb-2">{s.sharing.corporate.title}</h3>
                                        <p className="text-sm text-muted-foreground">{s.sharing.corporate.description}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <Scale className="h-4 w-4" />
                                        {s.sharing.legal.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-2">{s.sharing.legal.description}</p>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                        {getList(s.sharing.legal.items).map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 6. Storage & Retention */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <section className="bg-card border rounded-xl p-6 space-y-6">
                                <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight">
                                    <Lock className="h-5 w-5 text-primary" />
                                    {s.storage.title}
                                </h2>

                                <div>
                                    <h4 className="font-semibold text-sm mb-1">{s.storage.location.title}</h4>
                                    <p className="text-sm text-muted-foreground">{s.storage.location.description}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm mb-2">{s.storage.encryption.title}</h4>
                                    <ul className="space-y-1">
                                        {getList(s.storage.encryption.items).map((item: string, i: number) => (
                                            <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                                <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="pt-4 border-t">
                                    <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><Globe className="h-3 w-3" /> {s.storage.backup.title}</h4>
                                    <p className="text-xs text-muted-foreground">{s.storage.backup.description}</p>
                                </div>
                            </section>

                            <section className="bg-card border rounded-xl p-6 space-y-6">
                                <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight">
                                    <Trash2 className="h-5 w-5 text-primary" />
                                    {s.retention.title}
                                </h2>

                                <div>
                                    <h4 className="font-semibold text-sm mb-2">{s.retention.policy.title}</h4>
                                    <ul className="space-y-1">
                                        {getList(s.retention.policy.items).map((item: string, i: number) => (
                                            <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                                <span className="h-1 w-1 bg-muted-foreground rounded-full mt-1.5" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm mb-2">{s.retention.deletion.title}</h4>
                                    <ul className="space-y-1">
                                        {getList(s.retention.deletion.items).map((item: string, i: number) => (
                                            <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                                <span className="h-1 w-1 bg-muted-foreground rounded-full mt-1.5" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>
                        </div>

                        {/* 7. Rights */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Scale className="h-6 w-6 text-primary" />
                                {s.rights.title}
                            </h2>
                            <p className="text-muted-foreground mt-4 mb-6">{s.rights.description}</p>

                            <div className="grid sm:grid-cols-2 gap-3 mb-6">
                                {getList(s.rights.items).map((item: string, i: number) => (
                                    <div key={i} className="flex gap-3 items-start p-3 rounded-lg border bg-background">
                                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                        <span className="text-sm">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="text-sm font-medium bg-muted p-4 rounded-md">
                                {s.rights.exercise.description}
                            </p>
                        </section>

                        {/* 8. Security Measures Summary */}
                        <section className="bg-zinc-950 text-zinc-50 rounded-2xl p-8 shadow-xl">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight mb-6">
                                <Shield className="h-6 w-6 text-green-400" />
                                {s.securityMeasures.title}
                            </h2>
                            <p className="text-zinc-400 mb-6">{s.securityMeasures.description}</p>

                            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {getList(s.securityMeasures.items).map((item: string, i: number) => (
                                    <div key={i} className="bg-zinc-900 p-3 rounded border border-zinc-800 text-xs text-zinc-300 flex items-center justify-center text-center h-full">
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-zinc-500 text-center italic border-t border-zinc-800 pt-4">
                                {s.securityMeasures.disclaimer}
                            </p>
                        </section>

                        {/* 9. Third Partiest & Minors */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <section>
                                <h3 className="font-bold text-lg mb-4">{s.thirdParties.title}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{s.thirdParties.description}</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-4">
                                    {getList(s.thirdParties.items).map((item: string, i: number) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                                <p className="text-xs text-muted-foreground italic">{s.thirdParties.disclaimer}</p>
                            </section>

                            <section>
                                <h3 className="font-bold text-lg mb-4">{s.minors.title}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{s.minors.description}</p>
                                <p className="text-sm font-medium">{s.minors.contact}</p>
                            </section>
                        </div>

                        {/* 10. Contact & Changes */}
                        <div className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center border border-primary/10 space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight mb-4">{s.contact.title}</h2>
                                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">{s.contact.description}</p>
                                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
                                    {getList(s.contact.items).map((item: string, i: number) => (
                                        <div key={i} className="px-4 py-2 bg-background rounded-full border shadow-sm text-sm font-medium">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-center">
                                    <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20" asChild>
                                        <a href="mailto:contacto@seencel.com">
                                            <Mail className="mr-2 h-4 w-4" />
                                            contacto@seencel.com
                                        </a>
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-4">{s.contact.commitment}</p>
                            </div>

                            <div className="pt-8 border-t border-primary/10">
                                <h3 className="font-semibold mb-2">{s.changes.title}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{s.changes.description}</p>
                                <ul className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground mb-4">
                                    {getList(s.changes.items).map((item: string, i: number) => (
                                        <li key={i} className="flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> {item}
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs italic">{s.changes.footer}</p>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
