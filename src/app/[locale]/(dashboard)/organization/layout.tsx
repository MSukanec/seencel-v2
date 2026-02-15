import { getUserOrganizations } from "@/features/organization/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Organization Layout Guard
 * 
 * Redirects users without any organization to /organization/setup
 * when they try to access any /organization/* route (except setup itself).
 * 
 * This is the Onboarding 2 guard: users who completed Onboarding 1 (name/lastname)
 * but don't have an organization yet get redirected here.
 */
export default async function OrganizationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabaseAuth = await createClient();
    const { data: { user: authUser } } = await supabaseAuth.auth.getUser();

    if (!authUser) {
        const { redirect } = await import('next/navigation');
        return redirect('/login');
    }

    const { organizations, activeOrgId } = await getUserOrganizations(authUser.id);

    // If user has no organizations and no active org, redirect to setup
    // (unless they're already on the setup page — Next.js won't re-render this layout for setup)
    if (!activeOrgId && organizations.length === 0) {
        const { redirect } = await import('next/navigation');
        return redirect('/organization/setup');
    }

    return <>{children}</>;
}
