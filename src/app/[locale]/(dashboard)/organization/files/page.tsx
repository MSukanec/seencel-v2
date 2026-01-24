import { redirect } from "next/navigation";
import { getDashboardData } from "@/features/organization/queries";
import { getFiles } from "@/features/files/queries";
import { FilesPageView } from "@/features/files/views";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Files");
    return {
        title: t("title"),
    };
}

export default async function OrganizationFilesPage() {
    const dashboardData = await getDashboardData();

    if ('error' in dashboardData || !dashboardData.organization) {
        redirect("/organization");
    }

    const organization = dashboardData.organization as { id: string; name: string };
    const organizationId = organization.id;

    // Fetch all files for the organization (no project filter)
    const files = await getFiles(organizationId, null);

    return (
        <FilesPageView
            organizationId={organizationId}
            projectId={null}
            files={files}
        />
    );
}
