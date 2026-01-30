import type { Metadata } from "next";
import { SubcontractDetailPage, generateSubcontractMetadata } from "@/features/subcontracts/views/details/subcontract-detail-page";

interface SubcontractDetailPageProps {
    params: Promise<{
        projectId: string;
        subcontractId: string;
        locale: string;
    }>;
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    return generateSubcontractMetadata({ locale });
}

export default async function Page({ params }: SubcontractDetailPageProps) {
    const { projectId, subcontractId } = await params;
    return <SubcontractDetailPage projectId={projectId} subcontractId={subcontractId} />;
}
