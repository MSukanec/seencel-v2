import { FileText, Plus } from "lucide-react";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { setRequestLocale } from 'next-intl/server';
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function ChangelogPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth/login');

    return (
        <PageWrapper
            type="page"
            title="Changelog"
            icon={<FileText />}
            actions={
                <Button disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Entrada
                </Button>
            }
        >
            <ContentLayout variant="wide">
                <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
                    <div className="text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">Gestión de Changelog</p>
                        <p className="text-sm">Aquí podrás crear y gestionar las entradas del changelog</p>
                    </div>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}
