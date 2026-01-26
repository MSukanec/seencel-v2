import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Zap, BarChart3, Users, Globe2, ShieldCheck, Building2, HardHat, Layers } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations } from 'next-intl/server';
import { getUserProfile } from "@/features/profile/queries";

export default async function Home() {
  const t = await getTranslations('Landing');
  const { profile } = await getUserProfile();

  const features = [
    { icon: Zap, title: t('Features.items.projectManagement.title'), desc: t('Features.items.projectManagement.desc') },
    { icon: BarChart3, title: t('Features.items.financialControl.title'), desc: t('Features.items.financialControl.desc') },
    { icon: Users, title: t('Features.items.teamCollaboration.title'), desc: t('Features.items.teamCollaboration.desc') },
    { icon: Globe2, title: t('Features.items.globalOperations.title'), desc: t('Features.items.globalOperations.desc') },
    { icon: ShieldCheck, title: t('Features.items.enterpriseSecurity.title'), desc: t('Features.items.enterpriseSecurity.desc') },
    { icon: CheckCircle2, title: t('Features.items.qualityAssurance.title'), desc: t('Features.items.qualityAssurance.desc') }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/10">
      <Header variant="public" user={profile} />

      <main className="flex-1 min-h-screen">
        {/* HERO SECTION - FULL SCREEN */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <img
            src="/hero-landing-1080.jpg"
            alt="Seencel Construction Management"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Gradient overlays - Bottom Only */}
          <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-background via-background/80 to-transparent" />

          {/* Glow effects */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />

          <div className="relative z-10 container mx-auto px-4 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-8">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {t('Hero.badge') || "v2.0 Disponible Ahora"}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-white drop-shadow-sm">
              {t('Hero.title')}
            </h1>
            <p className="max-w-[800px] mx-auto text-xl text-zinc-200 mb-10 leading-relaxed drop-shadow-sm">
              {t('Hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {profile ? (
                <Link
                  href="/hub"
                  className={cn(buttonVariants({ size: "lg" }), "h-14 px-8 text-lg font-semibold rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 lg:min-w-[200px]")}
                >
                  {t('Hero.dashboard')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className={cn(buttonVariants({ size: "lg" }), "h-14 px-8 text-lg font-semibold rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 lg:min-w-[200px]")}
                >
                  {t('Hero.dashboard')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-24 md:py-32 relative">
          <div className="container px-4 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{t('Features.title')}</h2>
              <p className="text-lg text-muted-foreground">{t('Features.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <div key={i} className="group p-8 rounded-2xl border bg-card hover:bg-accent/5 transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
