import { PageWrapper } from "@/components/layout";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setRequestLocale } from 'next-intl/server';
import { getUserProfile } from "@/features/users/queries";
import { getUserOrganizations, getRecentOrganizationsCount } from "@/features/organization/queries";
import { getActiveHeroSections } from "@/features/hero-sections/queries";
import { getUserTimezone } from "@/features/users/queries";
import { getRecentPublicCourses } from "@/features/academy/course-queries";
import { HubView } from "@/features/hub";
import { LayoutDashboard } from "lucide-react";

export default async function HubPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    // Require authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    // Fetch only necessary data
    const [
        { profile },
        { organizations, activeOrgId },
        heroSlides,
        userTimezone,
        recentCourses,
        recentOrgsCount
    ] = await Promise.all([
        getUserProfile(),
        getUserOrganizations(),
        getActiveHeroSections('hub_hero'),
        getUserTimezone(),
        getRecentPublicCourses(2),
        getRecentOrganizationsCount(30)
    ]);

    // Derived data
    const activeOrg = organizations.find(o => o.id === activeOrgId);
    const activeOrgName = activeOrg?.name;
    const activeOrgLogo = activeOrg?.logo_url || null;

    return (
        <PageWrapper type="page" title="Hub" icon={<LayoutDashboard />}>
            <HubView
                user={profile}
                activeOrgId={activeOrgId}
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

