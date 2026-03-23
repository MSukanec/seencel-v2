import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { ContentLayout } from "@/components/layout";
import { ExternalAccessView } from "@/features/external-actors/views/external-access-view";
import { getOrganizationProjects } from "@/features/projects/queries";
import { getExternalActorsForOrg } from "@/features/team/actions";
import { getOrganizationPlanFeatures } from "@/actions/plans";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Colaboradores | Accesos Externos | Seencel",
        description: "Gestión de colaboradores externos de la organización",
        robots: "noindex, nofollow",
    };
}

export default async function ExternalAccessPage() {
    const { orgId: organizationId } = await requireAuthContext();

    const [projects, externalActorsRes, planFeatures] = await Promise.all([
        getOrganizationProjects(organizationId),
        getExternalActorsForOrg(organizationId),
        getOrganizationPlanFeatures(organizationId)
    ]);

    const externalActors = externalActorsRes.success ? externalActorsRes.data || [] : [];
    const maxExternalAdvisors = planFeatures?.max_external_advisors ?? 0;

    // Filter only advisors
    const advisors = externalActors.filter(actor => actor.actor_type !== "client");

    return (
        <ContentLayout variant="narrow">
            <ExternalAccessView 
                organizationId={organizationId}
                actors={advisors}
                projects={projects}
                actorType="advisor"
            />
        </ContentLayout>
    );
}
