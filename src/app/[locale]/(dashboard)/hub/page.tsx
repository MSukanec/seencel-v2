import { PageWrapper } from "@/components/layout";
import { redirect } from "next/navigation";
import { setRequestLocale } from 'next-intl/server';
import { getAuthUser } from "@/lib/auth";
import { getUserProfile, getUserTimezone } from "@/features/users/queries";
import { getUserOrganizations, getRecentOrganizationsCount } from "@/features/organization/queries";
import { getActiveHeroSections } from "@/features/hero-sections/queries";
import { getRecentPublicCourses } from "@/features/academy/queries";
import { HubView } from "@/features/hub";
import { LayoutDashboard } from "lucide-react";

export default async function HubPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    // Require authentication (single source of truth: auth.ts)
    const authUser = await getAuthUser();
    if (!authUser) {
        redirect('/auth/login');
    }

    // Fetch only necessary data
    const [
        { profile },
        { organizations, activeOrgId: orgId },
        heroSlides,
        userTimezone,
        recentCourses,
        recentOrgsCount
    ] = await Promise.all([
        getUserProfile(authUser.id),
        getUserOrganizations(authUser.id),
        getActiveHeroSections('hub_hero'),
        getUserTimezone(),
        getRecentPublicCourses(2),
        getRecentOrganizationsCount(30)
    ]);

    // Derived data
    const activeOrg = organizations.find((o: any) => o.id === orgId);
    const activeOrgName = activeOrg?.name;
    const activeOrgLogo = activeOrg?.logo_url || null;

    return (
        <PageWrapper type="page" title="Hub" icon={<LayoutDashboard />}>
            <HubView
                user={profile}
                activeOrgId={orgId}
                activeOrgName={activeOrgName}
                activeOrgLogo={activeOrgLogo}
                heroSlides={heroSlides}
                userTimezone={userTimezone || undefined}
                recentCourses={recentCourses}
                communityOrgsCount={recentOrgsCount + 100}
            />
        </PageWrapper>
    );
}

