import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { SecurityTab } from "@/features/security/components/security-tab";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Shield, User, Building, Settings2, Check, Crown, Users, Sparkles, CreditCard } from "lucide-react";
import { getTranslations } from 'next-intl/server';
import { getUserOrganizations } from "@/features/organization/queries";
import { SwitchOrganizationButton } from "@/features/organization/components/SwitchOrganizationButton";
import { getUserProfile } from "@/features/profile/queries";
import { ProfileForm } from "@/features/profile/components/ProfileForm";
import { PreferencesTab } from "@/components/settings/preferences-tab";
import { getStorageUrl } from "@/lib/storage-utils";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { AvatarManager } from "@/features/profile/components/AvatarManager";
import { HeaderTitleUpdater } from "@/components/layout/header-title-updater";
import { getCountries } from "@/features/countries/queries";
import { getBillingProfile } from "@/features/billing/queries";
import { BillingForm } from "@/features/billing/components/BillingForm";
import { getUserNotifications } from "@/features/notifications/queries";
import { NotificationsSettings } from "@/features/notifications/components/NotificationsSettings";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";

interface Organization {
    id: string;
    name: string;
    logo_path?: string;
    slug?: string;
    role?: string;
    plans?: {
        id: string;
        name: string;
        slug: string;
    } | null;
    members?: {
        name: string;
        image?: string | null;
        email?: string;
    }[];
}

// Helper to get plan badge variant and icon
function getPlanBadgeInfo(planSlug?: string | null) {
    switch (planSlug?.toLowerCase()) {
        case 'pro':
            return { variant: 'plan-pro' as const, icon: <Crown className="h-3 w-3" />, label: 'Pro' };
        case 'teams':
            return { variant: 'plan-teams' as const, icon: <Users className="h-3 w-3" />, label: 'Teams' };
        case 'free':
        default:
            return { variant: 'plan-free' as const, icon: <Sparkles className="h-3 w-3" />, label: 'Free' };
    }
}

export default async function SettingsPage() {
    const t = await getTranslations('Settings');
    const { organizations, activeOrgId } = (await getUserOrganizations()) as unknown as { organizations: Organization[], activeOrgId: string | null };
    const { profile } = await getUserProfile();
    const countries = await getCountries();
    const { profile: billingProfile } = await getBillingProfile();
    const { notifications } = await getUserNotifications();

    const currentOrgId = activeOrgId || organizations[0]?.id || "";

    // Initials logic
    const initials = profile?.full_name
        ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : "US";

    return (
        <PageWrapper type="page" title={t('title')}>
            <ContentLayout variant="settings">
                <HeaderTitleUpdater title={
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{t('myAccount')}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="font-semibold text-foreground">{t('title')}</span>
                    </div>
                } />

                <Tabs defaultValue="profile" orientation="vertical" className="flex flex-col lg:flex-row lg:space-x-12 lg:space-y-0 space-y-8 w-full">
                    <aside className="lg:w-64 flex-shrink-0">
                        <TabsList className="flex flex-col h-auto items-start justify-start bg-transparent p-0 space-y-1 w-full">
                            <TabsTrigger value="profile" className="w-full justify-start px-4 py-2 text-left font-semibold data-[state=active]:bg-muted hover:bg-muted/50 transition-colors">
                                <User className="mr-2 h-4 w-4" />
                                {t('tabs.profile')}
                            </TabsTrigger>
                            <TabsTrigger value="organization" className="w-full justify-start px-4 py-2 text-left font-semibold data-[state=active]:bg-muted hover:bg-muted/50 transition-colors">
                                <Building className="mr-2 h-4 w-4" />
                                {t('tabs.organization')}
                            </TabsTrigger>
                            <TabsTrigger value="security" className="w-full justify-start px-4 py-2 text-left font-semibold data-[state=active]:bg-muted hover:bg-muted/50 transition-colors">
                                <Shield className="mr-2 h-4 w-4" />
                                {t('tabs.security')}
                            </TabsTrigger>
                            <TabsTrigger value="billing" className="w-full justify-start px-4 py-2 text-left font-semibold data-[state=active]:bg-muted hover:bg-muted/50 transition-colors">
                                <CreditCard className="mr-2 h-4 w-4" />
                                {t('tabs.billing')}
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="w-full justify-start px-4 py-2 text-left font-semibold data-[state=active]:bg-muted hover:bg-muted/50 transition-colors">
                                <Bell className="mr-2 h-4 w-4" />
                                {t('tabs.notifications')}
                            </TabsTrigger>
                            <TabsTrigger value="preferences" className="w-full justify-start px-4 py-2 text-left font-semibold data-[state=active]:bg-muted hover:bg-muted/50 transition-colors">
                                <Settings2 className="mr-2 h-4 w-4" />
                                {t('tabs.preferences')}
                            </TabsTrigger>
                        </TabsList>
                    </aside>

                    <div className="flex-1 w-full text-foreground pb-16">
                        <TabsContent value="profile" className="space-y-6 mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('Profile.Avatar.title')}</CardTitle>
                                    <CardDescription>
                                        {t('Profile.Avatar.description')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AvatarManager
                                        avatarUrl={profile?.avatar_url || null}
                                        fullName={profile?.full_name || "User"}
                                        initials={initials}
                                    />
                                </CardContent>
                                <CardFooter className="bg-muted/50 border-t px-6 py-4">
                                    <p className="text-sm text-muted-foreground w-full">
                                        {t('Profile.Avatar.footer')}
                                    </p>
                                </CardFooter>
                            </Card>

                            <ProfileForm initialData={profile} countries={countries} />
                        </TabsContent>

                        <TabsContent value="organization" className="space-y-6 mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('Organization.title')}</CardTitle>
                                    <CardDescription>
                                        {t('Organization.description')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {organizations.length === 0 ? (
                                        <div className="rounded-xl border border-dashed bg-muted/50 p-6 text-center">
                                            <Building className="mx-auto h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                                            <p className="text-sm text-muted-foreground mb-4">{t('Organization.notFound')}</p>
                                            <Button variant="outline">{t('Organization.notFoundCreate')}</Button>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {organizations.map((org) => {
                                                const logoPath = org.logo_path
                                                    ? (org.logo_path.startsWith('organizations/') ? org.logo_path : `organizations/${org.logo_path}`)
                                                    : null;
                                                const logoUrl = getStorageUrl(logoPath, 'public-assets');

                                                return (
                                                    <div key={org.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center overflow-hidden ${logoUrl ? '' : 'bg-primary/10'}`}>
                                                                {logoUrl ? (
                                                                    <img src={logoUrl} alt={org.name} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <Building className="h-5 w-5 text-primary" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-semibold">{org.name}</h4>
                                                                    {(() => {
                                                                        const planInfo = getPlanBadgeInfo(org.plans?.slug);
                                                                        return (
                                                                            <Badge variant={planInfo.variant} icon={planInfo.icon} className="text-[10px] px-1.5 py-0">
                                                                                {planInfo.label}
                                                                            </Badge>
                                                                        );
                                                                    })()}
                                                                </div>
                                                                <div className="mt-1">
                                                                    <AvatarStack members={org.members || []} max={4} size={8} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {org.id === currentOrgId ? (
                                                            <Badge variant="success" icon={<Check className="h-3 w-3" />} className="px-3 py-1">
                                                                {t('Organization.current')}
                                                            </Badge>
                                                        ) : (
                                                            <SwitchOrganizationButton
                                                                organizationId={org.id}
                                                                currentOrgId={currentOrgId}
                                                                label={t('Organization.switch')}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security" className="space-y-6 mt-0">
                            <SecurityTab />
                        </TabsContent>

                        <TabsContent value="billing" className="space-y-6 mt-0">
                            <BillingForm initialData={billingProfile} countries={countries} />
                        </TabsContent>

                        <TabsContent value="notifications" className="space-y-6 mt-0">
                            <NotificationsSettings initialNotifications={notifications} />
                        </TabsContent>

                        <TabsContent value="preferences" className="space-y-6 mt-0">
                            <PreferencesTab />
                        </TabsContent>
                    </div>
                </Tabs>
            </ContentLayout>
        </PageWrapper>
    );
}
