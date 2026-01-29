import { ContentLayout } from "@/components/layout";
import { ComingSoonBlock } from "@/components/ui/coming-soon-block";
import { checkIsAdmin } from "@/features/users/queries";
import { setRequestLocale } from 'next-intl/server';
import { PageWrapper } from "@/components/layout";
import { Sparkles, Users, Trophy, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
    params: Promise<{
        locale: string;
    }>;
}

export default async function FoundersPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const isAdmin = await checkIsAdmin();

    return (
        <ComingSoonBlock
            isAdmin={isAdmin}
            title="Programa Fundadores"
            description="Únete a los primeros miembros de la comunidad Seencel. Beneficios exclusivos, acceso anticipado a funciones y reconocimiento permanente."
        >
            <PageWrapper
                type="page"
                title="Fundadores"
                icon={<Sparkles />}
            >
                <ContentLayout variant="narrow">
                    <div className="space-y-6">
                        {/* Hero Section */}
                        <div className="text-center py-8">
                            <h1 className="text-3xl font-bold mb-2">Programa Fundadores</h1>
                            <p className="text-muted-foreground">
                                Sé parte de los primeros en construir el futuro de Seencel
                            </p>
                        </div>

                        {/* Benefits Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="pb-2">
                                    <Trophy className="w-8 h-8 text-primary mb-2" />
                                    <CardTitle className="text-lg">Reconocimiento</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Badge de Fundador permanente en tu perfil y organización.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <Star className="w-8 h-8 text-primary mb-2" />
                                    <CardTitle className="text-lg">Acceso Anticipado</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Prueba nuevas funciones antes que nadie y da tu feedback.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <Users className="w-8 h-8 text-primary mb-2" />
                                    <CardTitle className="text-lg">Comunidad Exclusiva</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Acceso a canales privados y eventos solo para fundadores.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </ContentLayout>
            </PageWrapper>
        </ComingSoonBlock>
    );
}
