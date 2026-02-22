import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserOrganizations } from "@/features/organization/queries";
import { checkPendingInvitation } from "@/actions/invitation-actions";
import { checkIsAdmin } from "@/features/users/queries";
import { WorkspaceSetupView } from "@/features/onboarding/views/workspace-setup-view";

export default async function WorkspaceSetupPage({
    searchParams,
}: {
    searchParams: Promise<{ new?: string }>;
}) {
    const params = await searchParams;
    const isNewOrg = params.new === "true";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    // Parallel: orgs + admin check + invitations + feature flag + currencies
    const [{ organizations, activeOrgId }, isAdmin, pendingInvitation, orgCreationFlag, currenciesResult] = await Promise.all([
        getUserOrganizations(user.id),
        checkIsAdmin(),
        isNewOrg ? Promise.resolve(null) : checkPendingInvitation(user.email || ''),
        supabase.schema('public').from('feature_flags').select('status').eq('key', 'org_creation_enabled').single(),
        supabase.schema('finance').from('currencies').select('id, code, name, symbol, country').order('name'),
    ]);

    const orgCreationEnabled = orgCreationFlag?.data?.status === 'active';
    const currencies = currenciesResult?.data ?? [];

    // If user already has an org and is NOT explicitly creating a new one, redirect
    if ((activeOrgId || organizations.length > 0) && !isNewOrg) {
        return redirect('/organization');
    }

    return (
        <WorkspaceSetupView
            pendingInvitation={pendingInvitation}
            isNewOrg={isNewOrg}
            isAdmin={isAdmin}
            orgCreationEnabled={orgCreationEnabled}
            currencies={currencies}
        />
    );
}
