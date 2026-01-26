import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Bell } from "lucide-react";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { setRequestLocale } from 'next-intl/server';
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHeroSections } from "@/features/hero-sections/queries";
import { CarouselManagementView } from "@/features/hero-sections/components/carousel-management-view";

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function HubContentPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth/login');

    // Fetch carousel slides
    const slides = await getHeroSections('hub_hero');

    return (
        <Tabs defaultValue="carousel" className="w-full h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Contenido HUB"
                icon={<Sparkles />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-6 flex items-start justify-start">
                        <TabsTrigger
                            value="carousel"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                <span>Carousel</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="announcements"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4" />
                                <span>Anuncios Globales</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <TabsContent value="carousel" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <CarouselManagementView slides={slides} />
                    </ContentLayout>
                </TabsContent>

                <TabsContent value="announcements" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
                            <div className="text-center text-muted-foreground">
                                <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-medium">Anuncios Globales</p>
                                <p className="text-sm">Gestiona announcement bars, sonner notifications y banners</p>
                            </div>
                        </div>
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
