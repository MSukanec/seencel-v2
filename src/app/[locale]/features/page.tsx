import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { getUserProfile } from "@/features/users/queries";
import { DemoCard, MiniKanban, MiniBudget, MiniHealthBlob, MiniGantt } from "@/features/interactive-demos";
import { Kanban, HeartPulse, BarChart3, FileStack, Calculator, Calendar } from "lucide-react";

export default async function FeaturesPage() {
    const { profile } = await getUserProfile();

    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/30">
            <Header variant="public" user={profile} />

            <main className="flex-1 py-16">
                <div className="container mx-auto px-4">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Características
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Explorá nuestras herramientas de forma interactiva.
                            Tocá, arrastrá y probá cada función antes de empezar.
                        </p>
                    </div>

                    {/* Demos Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">

                        {/* Demo 1: Kanban */}
                        <DemoCard
                            title="Tablero Kanban"
                            description="Organizá tareas visualmente con drag & drop"
                            icon={Kanban}
                            badge="Interactivo"
                            badgeColor="bg-green-500"
                        >
                            <MiniKanban />
                        </DemoCard>

                        {/* Demo 2: Presupuestos */}
                        <DemoCard
                            title="Presupuestos"
                            description="Gestión visual de costos en tiempo real"
                            icon={Calculator}
                            badge="Interactivo"
                            badgeColor="bg-green-500"
                        >
                            <MiniBudget />
                        </DemoCard>

                        {/* Demo 3: Salud del Proyecto */}
                        <DemoCard
                            title="Salud del Proyecto"
                            description="Indicadores visuales del estado de tu obra"
                            icon={HeartPulse}
                            badge="Interactivo"
                            badgeColor="bg-green-500"
                        >
                            <MiniHealthBlob />
                        </DemoCard>

                        {/* Demo 4: Diagrama Gantt */}
                        <DemoCard
                            title="Diagrama Gantt"
                            description="Timeline visual de tu proyecto"
                            icon={Calendar}
                            badge="Interactivo"
                            badgeColor="bg-green-500"
                        >
                            <MiniGantt />
                        </DemoCard>

                    </div>

                    {/* CTA Section */}
                    <div className="text-center mt-16">
                        <p className="text-muted-foreground mb-4">
                            ¿Querés ver más? Probá SEENCEL gratis por 14 días.
                        </p>
                        <a
                            href="/signup"
                            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                        >
                            Empezar Gratis
                        </a>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
