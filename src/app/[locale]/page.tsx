import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
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
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(163,230,53,0.12),rgba(255,255,255,0))]" />
          <div className="container px-4 md:px-6 mx-auto relative z-10 text-center">
            <h1 className="text-4xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50 mb-6">
              {t('Hero.title')}
            </h1>
            <p className="max-w-[800px] mx-auto text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              {t('Hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {profile ? (
                <Link
                  href="/hub"
                  className={cn(buttonVariants({ size: "lg" }), "h-12 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20")}
                >
                  {t('Hero.dashboard')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className={cn(buttonVariants({ size: "lg" }), "h-12 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20")}
                >
                  {t('Hero.getStarted')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              )}

              <Link
                href={"#features" as any}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-8 text-lg rounded-full backdrop-blur-sm bg-background/50 hover:bg-muted/50")}
              >
                {t('Hero.howItWorks')}
              </Link>
            </div>

            {/* Hero Visual - Construction themed */}
            <div className="mt-20 relative mx-auto max-w-5xl rounded-xl border bg-background/50 shadow-2xl overflow-hidden backdrop-blur-sm">
              <div className="aspect-[16/9] bg-gradient-to-br from-primary/5 via-muted/50 to-muted flex items-center justify-center">
                <div className="grid grid-cols-3 gap-8 p-8 opacity-30">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-12 w-12" />
                    <span className="text-xs uppercase tracking-widest">Proyectos</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <HardHat className="h-12 w-12" />
                    <span className="text-xs uppercase tracking-widest">Equipos</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Layers className="h-12 w-12" />
                    <span className="text-xs uppercase tracking-widest">Finanzas</span>
                  </div>
                </div>
              </div>
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

        {/* PRICING SECTION */}
        <section id="pricing" className="py-24 bg-muted/30">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{t('Pricing.title')}</h2>
              <p className="text-lg text-muted-foreground">{t('Pricing.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Free Tier */}
              <div className="rounded-2xl border bg-background p-8 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold">{t('Pricing.starter.title')}</h3>
                  <div className="text-4xl font-bold mt-4">$0 <span className="text-lg font-normal text-muted-foreground">/mes</span></div>
                  <p className="text-muted-foreground mt-2">{t('Pricing.starter.desc')}</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {['Hasta 3 proyectos activos', 'Control de gastos básico', '5 miembros de equipo', 'Soporte por comunidad'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/signup">{t('Pricing.starter.cta')}</Link>
                </Button>
              </div>

              {/* Pro Tier */}
              <div className="rounded-2xl border-2 border-primary bg-background p-8 flex flex-col relative shadow-2xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {t('Pricing.pro.popular')}
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold">{t('Pricing.pro.title')}</h3>
                  <div className="text-4xl font-bold mt-4">$49 <span className="text-lg font-normal text-muted-foreground">/mes</span></div>
                  <p className="text-muted-foreground mt-2">{t('Pricing.pro.desc')}</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {['Proyectos ilimitados', 'Certificaciones de avance', 'Reportes financieros avanzados', 'Soporte prioritario', 'Personalización de marca'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                  <Link href="/signup">{t('Pricing.pro.cta')}</Link>
                </Button>
              </div>

              {/* Enterprise Tier */}
              <div className="rounded-2xl border bg-background p-8 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold">{t('Pricing.enterprise.title')}</h3>
                  <div className="text-4xl font-bold mt-4">Custom</div>
                  <p className="text-muted-foreground mt-2">{t('Pricing.enterprise.desc')}</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {['Gerente de cuenta dedicado', 'SLA garantizado 99.9%', 'Implementación on-premise', 'Integraciones personalizadas (ERP)', 'SSO y seguridad avanzada'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/contact">{t('Pricing.enterprise.cta')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
