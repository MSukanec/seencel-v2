import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { LayoutTemplate } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailsPreviewView } from "@/features/admin/views/emails-preview-view";
import { CheckoutPagesPreviewView } from "@/features/admin/views/checkout-pages-preview-view";

export const metadata: Metadata = {
    title: "Plantillas | Admin | SEENCEL",
    description: "Preview y gestión de templates de email y páginas de checkout",
    robots: "noindex, nofollow",
};

export default function AdminTemplatesPage() {
    return (
        <Tabs defaultValue="emails" className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Plantillas"
                icon={<LayoutTemplate className="h-5 w-5" />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                        <TabsTrigger value="emails">Emails</TabsTrigger>
                        <TabsTrigger value="pages">Páginas</TabsTrigger>
                    </TabsList>
                }
            >
                <ContentLayout variant="wide">
                    <TabsContent value="emails" className="mt-0">
                        <EmailsPreviewView />
                    </TabsContent>
                    <TabsContent value="pages" className="mt-0">
                        <CheckoutPagesPreviewView />
                    </TabsContent>
                </ContentLayout>
            </PageWrapper>
        </Tabs>
    );
}
