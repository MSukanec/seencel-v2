import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { ContentLayout } from "@/components/layout";
import { ExternalAccessView } from "@/features/external-actors/views/external-access-view";
import { getOrganizationProjects } from "@/features/projects/queries";
import { getExternalActorsForOrg } from "@/features/team/actions";
import { getOrganizationPlanFeatures } from "@/actions/plans";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Clientes | Accesos Externos | Seencel",
        description: "Gestión de clientes de la organización",
        robots: "noindex, nofollow",
    };
}

export default async function ExternalAccessClientsPage() {
    const { orgId: organizationId } = await requireAuthContext();

    const [projects, externalActorsRes, planFeatures] = await Promise.all([
        getOrganizationProjects(organizationId),
        getExternalActorsForOrg(organizationId),
        getOrganizationPlanFeatures(organizationId)
    ]);

    const externalActors = externalActorsRes.success ? externalActorsRes.data || [] : [];

    // Filter only clients
    const clients = externalActors.filter(actor => actor.actor_type === "client");

    return (
        <ContentLayout variant="narrow">
            <ExternalAccessView 
                organizationId={organizationId}
                actors={clients}
                projects={projects}
                actorType="client"
            />
        </ContentLayout>
    );
}
