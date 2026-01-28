import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { Mail } from "lucide-react";
import { EmailsPreviewView } from "@/features/admin/views/emails-preview-view";

export const metadata: Metadata = {
    title: "Emails | Admin | SEENCEL",
    description: "Preview y gestión de templates de email transaccionales",
    robots: "noindex, nofollow",
};

export default function AdminEmailsPage() {
    return (
        <PageWrapper
            type="page"
            title="Templates de Email"
            icon={<Mail className="h-5 w-5" />}
        >
            <ContentLayout variant="wide">
                <EmailsPreviewView />
            </ContentLayout>
        </PageWrapper>
    );
}
