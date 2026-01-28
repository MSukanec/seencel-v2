"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Building2,
    GraduationCap,
    Vote,
    FlaskConical,
    MessageCircle,
    Award,
    List,
    Infinity,
    Sparkles,
    Clock,
    CheckCircle2,
    Zap,
    ArrowRight,
    Users,
    Shield,
    Play,
} from "lucide-react";

interface FoundersContentProps {
    isDashboard?: boolean;
}

const benefitIcons = {
    organizational: Building2,
    training: GraduationCap,
    roadmap: Vote,
    labMode: FlaskConical,
    discord: MessageCircle,
    badge: Award,
    directory: List,
    permanent: Infinity,
};

const benefitKeys = [
    "organizational",
    "training",
    "roadmap",
    "labMode",
    "discord",
    "badge",
    "directory",
    "permanent",
] as const;

export function FoundersContent({ isDashboard = false }: FoundersContentProps) {
    const t = useTranslations("Founders");

    // Founders program links to annual plans (required for founder status)
    const checkoutHref = {
        pathname: "/checkout" as const,
        query: { product: "plan-pro", cycle: "annual" }
    };

    // Rich text components for next-intl
    const richTextComponents = {
        bold: (chunks: React.ReactNode) => (
            <strong className="text-foreground font-semibold">{chunks}</strong>
        ),
    };

    return (
        <div className="relative">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <img
                    src="/images/founders-hero-bg.webp"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/60" />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

                {/* Glow effects */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-chart-2/15 rounded-full blur-[100px] animate-pulse delay-1000" />

                <div className="relative z-10 container mx-auto px-4 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-8">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                            {t("hero.badge")}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {t("hero.title")}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
                        {t("hero.subtitle")}
                    </p>

                    {/* CTA */}
                    <Button
                        asChild
                        size="lg"
                        className="h-14 px-8 text-lg font-semibold rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
                    >
                        <Link href={checkoutHref}>
                            {t("hero.cta")}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
                        <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
                    </div>
                </div>
            </section>

            {/* Essence Section */}
            <section className="py-24 bg-muted/30">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-chart-4/10 border border-chart-4/20 mb-6">
                        <Sparkles className="h-3 w-3 text-chart-4" />
                        <span className="text-xs font-semibold tracking-wider text-chart-4">
                            {t("essence.badge")}
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold mb-8">
                        {t("essence.title")}
                    </h2>

                    <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                        <p>{t.rich("essence.description1", richTextComponents)}</p>
                        <p>{t.rich("essence.description2", richTextComponents)}</p>
                        <p>{t.rich("essence.description3", richTextComponents)}</p>
                    </div>

                    {/* Urgency Indicator */}
                    <div className="mt-12 inline-flex items-center gap-3 px-6 py-3 rounded-full bg-destructive/10 border border-destructive/20">
                        <Clock className="h-5 w-5 text-destructive animate-pulse" />
                        <span className="text-destructive font-medium">
                            {t("essence.urgency")}
                        </span>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            {t("benefits.title")}
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            {t("benefits.subtitle")}
                        </p>
                    </div>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        {benefitKeys.map((key) => {
                            const Icon = benefitIcons[key];
                            return (
                                <Card
                                    key={key}
                                    className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                                >
                                    <CardContent className="p-6">
                                        <div className="mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                <Icon className="h-6 w-6 text-primary" />
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-lg mb-2">
                                            {t(`benefits.items.${key}.title`)}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {t(`benefits.items.${key}.description`)}
                                        </p>
                                    </CardContent>
                                    {/* Hover glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Course Bonus Section */}
            <section className="py-24 bg-gradient-to-b from-zinc-900 to-background relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-chart-1/10 border border-chart-1/20 mb-8">
                            <GraduationCap className="h-4 w-4 text-chart-1" />
                            <span className="text-sm font-medium text-chart-1">
                                {t("course.badge")}
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                            {t("course.title")}
                        </h2>

                        <p className="text-lg text-zinc-400 leading-relaxed mb-8">
                            {t.rich("course.description", richTextComponents)}
                        </p>

                        {/* Stats */}
                        <div className="flex flex-wrap justify-center gap-8 mb-12">
                            <div className="flex items-center gap-2 text-zinc-300">
                                <Users className="h-5 w-5 text-primary" />
                                <span>{t("course.stats.students")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-300">
                                <Shield className="h-5 w-5 text-primary" />
                                <span>{t("course.stats.endorsement")}</span>
                            </div>
                        </div>

                        {/* Price Comparison Card */}
                        <Card className="max-w-md mx-auto bg-white/5 backdrop-blur-sm border-white/10">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-center gap-8">
                                    <div className="text-center">
                                        <p className="text-sm text-zinc-400 mb-1">
                                            {t("course.price.original")}
                                        </p>
                                        <p className="text-2xl font-bold text-zinc-300 line-through">
                                            {t("course.price.originalValue")}
                                        </p>
                                    </div>
                                    <ArrowRight className="h-6 w-6 text-primary" />
                                    <div className="text-center">
                                        <p className="text-sm text-zinc-400 mb-1">
                                            {t("course.price.new")}
                                        </p>
                                        <p className="text-3xl font-bold text-primary">
                                            {t("course.price.newValue")}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CTA */}
                        <Button
                            variant="outline"
                            size="lg"
                            className="mt-8 border-primary/50 text-primary hover:bg-primary/10"
                        >
                            <Play className="mr-2 h-5 w-5" />
                            {t("course.cta")}
                        </Button>
                    </div>
                </div>
            </section>

            {/* How to Join Section */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            {t("howToJoin.title")}
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            {t("howToJoin.subtitle")}
                        </p>
                    </div>

                    <div className="max-w-2xl mx-auto">
                        <Card className="border-border/50">
                            <CardContent className="p-8 space-y-8">
                                {/* Step 1 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">
                                            {t("howToJoin.steps.subscription.title")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {t("howToJoin.steps.subscription.description")}
                                        </p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                                            <Zap className="h-5 w-5 text-chart-2" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">
                                            {t("howToJoin.steps.activation.title")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {t("howToJoin.steps.activation.description")}
                                        </p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-destructive" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">
                                            {t("howToJoin.steps.limited.title")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {t("howToJoin.steps.limited.description")}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-24 bg-gradient-to-b from-muted/50 to-background">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        {t("cta.title")}
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
                        {t("cta.subtitle")}
                    </p>

                    <Button
                        asChild
                        size="lg"
                        className="h-16 px-12 text-xl font-semibold rounded-full bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/25 transition-all hover:shadow-primary/40 hover:scale-105"
                    >
                        <Link href={checkoutHref}>
                            {t("cta.button")}
                            <ArrowRight className="ml-3 h-6 w-6" />
                        </Link>
                    </Button>

                    <p className="mt-6 text-sm text-muted-foreground">
                        {t("cta.note")}
                    </p>
                </div>
            </section>
        </div>
    );
}

