import type { Metadata } from "next";
import { SubcontractDetailPage, generateSubcontractMetadata } from "@/features/subcontracts/views/details/subcontract-detail-page";

interface SubcontractDetailPageProps {
    params: Promise<{
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
    const { subcontractId } = await params;
    return <SubcontractDetailPage subcontractId={subcontractId} />;
}
