import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserOrganizations } from "@/features/organization/queries";
import { checkPendingInvitation } from "@/actions/invitation-actions";
import { WorkspaceSetupView } from "./workspace-setup-view";

export default async function WorkspaceSetupPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    // If user already has an org, redirect to dashboard
    const { organizations, activeOrgId } = await getUserOrganizations(user.id);
    if (activeOrgId || organizations.length > 0) {
        return redirect('/organization');
    }

    // Check for pending invitations
    const pendingInvitation = await checkPendingInvitation(user.email || '');

    return (
        <WorkspaceSetupView
            pendingInvitation={pendingInvitation}
        />
    );
}
