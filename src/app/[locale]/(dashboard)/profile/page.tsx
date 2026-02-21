import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User } from "lucide-react";

// Views
import { ProfileInfoView } from "@/features/users/views/profile-info-view";
import { ProfileOrganizationsView } from "@/features/users/views/profile-organizations-view";
import { ProfileSecurityView } from "@/features/users/views/profile-security-view";
import { ProfileBillingView } from "@/features/users/views/profile-billing-view";
import { ProfileNotificationsView } from "@/features/users/views/profile-notifications-view";
import { PreferencesView } from "@/features/users/views/profile-preferences-view";

// Queries
import { getUserOrganizations } from "@/features/organization/queries";
import { getUserProfile, checkIsAdmin } from "@/features/users/queries";
import { getUserTimezone } from "@/features/users/queries";
import { getCountries } from "@/features/countries/queries";
import { getBillingProfile } from "@/features/billing/queries";

// Tab trigger style (matches other pages)
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

// ✅ METADATA
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Settings' });
    return {
        title: `${t('title')} | SEENCEL`,
        description: t('description'),
        robots: "noindex, nofollow",
    };
}

interface PageProps {
    searchParams: Promise<{ tab?: string }>;
}

export default async function ProfilePage({ searchParams }: PageProps) {
    const params = await searchParams;
    const validTabs = ["profile", "organization", "security", "billing", "notifications", "preferences"] as const;
    const requestedTab = params.tab || "profile";
    const initialTab = validTabs.includes(requestedTab as any) ? requestedTab : "profile";

    // ✅ ERROR BOUNDARY
    try {
        // ✅ PARALLEL QUERIES
        const [
            orgData,
            profileData,
            countries,
            billingData,
            userTimezone,
            isAdmin,
        ] = await Promise.all([
            getUserOrganizations(),
            getUserProfile(),
            getCountries(),
            getBillingProfile(),
            getUserTimezone(),
            checkIsAdmin(),
        ]);

        const { organizations, activeOrgId, currentUserId } = orgData as any;
        const { profile } = profileData;
        const { profile: billingProfile } = billingData;

        const t = await getTranslations('Settings');

        return (
            <Tabs defaultValue={initialTab} syncUrl="tab" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={t('title')}
                    icon={<User />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                            <TabsTrigger value="profile" className={tabTriggerClass}>
                                {t('tabs.profile')}
                            </TabsTrigger>
                            <TabsTrigger value="organization" className={tabTriggerClass}>
                                {t('tabs.organization')}
                            </TabsTrigger>
                            <TabsTrigger value="security" className={tabTriggerClass}>
                                {t('tabs.security')}
                            </TabsTrigger>
                            <TabsTrigger value="billing" className={tabTriggerClass}>
                                {t('tabs.billing')}
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className={tabTriggerClass}>
                                {t('tabs.notifications')}
                            </TabsTrigger>
                            <TabsTrigger value="preferences" className={tabTriggerClass}>
                                {t('tabs.preferences')}
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    <TabsContent value="profile" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ProfileInfoView profile={profile} countries={countries} />
                    </TabsContent>

                    <TabsContent value="organization" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ProfileOrganizationsView
                            organizations={organizations}
                            activeOrgId={activeOrgId}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                        />
                    </TabsContent>

                    <TabsContent value="security" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ProfileSecurityView />
                    </TabsContent>

                    <TabsContent value="billing" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ProfileBillingView billingProfile={billingProfile} countries={countries} />
                    </TabsContent>

                    <TabsContent value="notifications" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ProfileNotificationsView />
                    </TabsContent>

                    <TabsContent value="preferences" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <PreferencesView initialTimezone={userTimezone} />
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
