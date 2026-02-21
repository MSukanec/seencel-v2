import { getUserProfile, checkUserRoles, checkUserAccessContext } from "@/features/users/queries";
import { getUserOrganizations } from "@/features/organization/queries";
import { LayoutSwitcher } from "@/components/layout";
import { getFeatureFlags } from "@/actions/feature-flags";
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider";
import { ThemeCustomizationHydrator } from "@/stores/theme-store";

import { OrganizationStoreHydrator } from "@/stores/organization-store";
import MaintenancePage from "./maintenance/page";
import { MemberRemovedOverlay } from "@/features/organization/components/member-removed-overlay";
import { PendingInvitationChecker } from "@/features/team/components/pending-invitation-checker";
import { RevokedAccessChecker } from "@/features/external-actors/components/revoked-access-checker";
import type { ExternalActorType } from "@/features/external-actors/types";
import { createClient } from "@/lib/supabase/server";

// Next.js detects this layout as dynamic automatically because it uses
// cookies (Supabase createClient). No need for force-dynamic.
// Removing force-dynamic enables Request Deduplication and partial caching.

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ── Phase 0: Single auth check (was called 3x independently) ──
    const supabaseAuth = await createClient();
    const { data: { user: authUser } } = await supabaseAuth.auth.getUser();
    if (!authUser) {
        const { redirect } = await import('next/navigation');
        return redirect('/login');
    }

    // ── Phase 1: Parallel minimal queries (only what layout/sidebar needs) ──
    // All functions receive authId to skip redundant auth.getUser() calls
    const [flags, roles, userResult, orgsResult] = await Promise.all([
        getFeatureFlags(),
        checkUserRoles(authUser.id),
        getUserProfile(authUser.id),
        getUserOrganizations(authUser.id),
    ]);

    const { isAdmin, isBetaTester } = roles;
    const { profile } = userResult;
    const { organizations, activeOrgId } = orgsResult;

    // Phase 1b: Access context (member vs external) — runs in parallel with above
    // Needed immediately so the sidebar renders with the correct nav from the start.
    const initialAccessContext = await checkUserAccessContext(authUser.id, activeOrgId || null);

    // Maintenance mode check
    const isMaintenanceMode = flags.find(f => f.key === "dashboard_maintenance_mode")?.value ?? false;
    if (isMaintenanceMode && !isAdmin && !isBetaTester) {
        return <MaintenancePage />;
    }

    // Onboarding guard (moved from middleware to avoid 2 queries per HTTP request)
    if (profile && !profile.signup_completed) {
        const { redirect } = await import('next/navigation');
        return redirect('/onboarding');
    }


    // Detect stale membership: user was removed from their active org
    const wasRemoved = !isAdmin && activeOrgId && organizations.length > 0 && !organizations.some((o: any) => o.id === activeOrgId);
    const fallbackOrg = wasRemoved ? organizations[0] : null;

    // Detect admin impersonation: admin viewing an org they don't belong to
    const isImpersonating = isAdmin && activeOrgId != null && !organizations.some((o: any) => o.id === activeOrgId);
    let impersonationOrgName: string | null = null;
    if (isImpersonating && activeOrgId) {
        const supabaseForOrgName = await createClient();
        const { data: orgData } = await supabaseForOrgName
            .schema('iam').from('organizations')
            .select('name')
            .eq('id', activeOrgId)
            .single();
        impersonationOrgName = orgData?.name || null;
    }

    // ── Pending invitations are checked lazily by PendingInvitationChecker
    // after mount (same pattern as OrganizationStoreHydrator). ──

    // ── Heavy data (currencies, wallets, projects, clients) is loaded lazily
    // by OrganizationStoreHydrator via fetchOrganizationStoreData() server action.
    // This does NOT block the layout render. ──

    return (
        <>
            {/* Zustand Store Hydrators — Phase 1 instant, Phase 2 lazy */}
            <OrganizationStoreHydrator
                activeOrgId={activeOrgId || null}
                isImpersonating={isImpersonating}
                impersonationOrgName={impersonationOrgName}
                initialAccessContext={{
                    isMember: initialAccessContext.isMember,
                    isExternal: initialAccessContext.isExternal,
                    externalActorType: initialAccessContext.externalActorType as ExternalActorType | null,
                }}
            />
            <ThemeCustomizationHydrator />
            <FeatureFlagsProvider flags={flags} isAdmin={isAdmin} isBetaTester={isBetaTester}>
                <LayoutSwitcher user={profile} activeOrgId={activeOrgId || undefined}>
                    {children}
                    {wasRemoved && fallbackOrg && (
                        <MemberRemovedOverlay
                            fallbackOrgId={fallbackOrg.id}
                            fallbackOrgName={fallbackOrg.name}
                        />
                    )}
                    {!wasRemoved && (
                        <PendingInvitationChecker email={profile?.email} />
                    )}
                    {/* Guard: shows overlay if external actor's access was revoked while logged in */}
                    {initialAccessContext.isExternal && !initialAccessContext.isMember && (
                        <RevokedAccessChecker
                            orgId={activeOrgId || null}
                            externalActorType={initialAccessContext.externalActorType}
                        />
                    )}
                </LayoutSwitcher>
            </FeatureFlagsProvider>
        </>
    );
}
