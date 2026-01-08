import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Zap, BarChart3, Users, Globe2, ShieldCheck } from "lucide-react";
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

  const brands = ['Acme Build', 'Vertex Construction', 'Nexus Architects', 'Solid Foundations', 'Elevate Group'];

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/10">
      <Header variant="public" user={profile} />

      <main className="flex-1 min-h-screen">
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
          <div className="container px-4 md:px-6 mx-auto relative z-10 text-center">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-8">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
              {t('Hero.badge')}
            </div>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50 mb-6">
              {t('Hero.title')}
            </h1>
            <p className="max-w-[800px] mx-auto text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              {t('Hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {profile ? (
                <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" asChild>
                  <Link href="/organization">
                    {t('Hero.dashboard')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" asChild>
                  <Link href="/signup">
                    {t('Hero.getStarted')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}

              <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full backdrop-blur-sm bg-background/50 hover:bg-muted/50" asChild>
                <Link href={"#features" as any}>{t('Hero.howItWorks')}</Link>
              </Button>
            </div>

            {/* Hero Image / Mockup Placeholder */}
            <div className="mt-20 relative mx-auto max-w-5xl rounded-xl border bg-background/50 shadow-2xl overflow-hidden backdrop-blur-sm">
              <div className="aspect-[16/9] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center text-muted-foreground">
                <div className="space-y-4 text-center">
                  <BarChart3 className="h-16 w-16 mx-auto opacity-20" />
                  <p className="text-sm uppercase tracking-widest opacity-40">{t('Hero.preview')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BRANDS / TRUST SECTION */}
        <section className="py-12 border-y border-border/5 bg-muted/20">
          <div className="container px-4 text-center">
            <p className="text-sm text-muted-foreground mb-8 font-medium">{t('Brands.trustedBy')}</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {brands.map((brand) => (
                <span key={brand} className="text-xl md:text-2xl font-bold font-serif">{brand}</span>
              ))}
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
                  <div className="text-4xl font-bold mt-4">$0 <span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                  <p className="text-muted-foreground mt-2">{t('Pricing.starter.desc')}</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {['Up to 3 active projects', 'Basic Financial Tools', '5 Team Members', 'Community Support'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> {item}
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
                  <div className="text-4xl font-bold mt-4">$49 <span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                  <p className="text-muted-foreground mt-2">{t('Pricing.pro.desc')}</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {['Unlimited Projects', 'Advanced Analytics', 'Unlimited Team Members', 'Priority Support', 'Custom Branding'].map((item) => (
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
                  {['Dedicated Account Manager', 'SLA Guarantees', 'On-premise Deployment', 'Custom Integrations', 'SSO & Advanced Security'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/contact" className="pointer-events-none opacity-50">{t('Pricing.enterprise.cta')}</Link>
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
