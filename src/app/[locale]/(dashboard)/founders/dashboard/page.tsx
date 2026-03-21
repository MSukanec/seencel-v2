import { setRequestLocale } from 'next-intl/server';
import { PageWrapper } from "@/components/layout/dashboard/shell";
import { Medal } from "lucide-react";
import { getForumThreads, getUserForumContributions } from "@/actions/forum";
import { FoundersOverviewView } from "@/features/founders/views/founders-overview-view";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";

interface PageProps {
    params: Promise<{
        locale: string;
    }>;
}

export default async function FoundersProgramPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const user = await getAuthUser();
    if (!user) {
        redirect("/login" as any);
        return null;
    }

    const supabase = await createClient();
    const { data: profile } = await supabase.from('user_profiles').select('current_org_id').eq('id', user.id).single();
    
    let memberSinceDate = new Date().toISOString();
    if (profile?.current_org_id) {
        const { data: org } = await supabase.from('organizations').select('created_at').eq('id', profile.current_org_id).single();
        if (org?.created_at) {
            memberSinceDate = org.created_at;
        }
    }

    const contributionsCount = await getUserForumContributions(user.id);

    // Fetch global threads for the forum card
    const latestThreads = await getForumThreads(null);

    return (
        <PageWrapper
            title="Visión General"
            icon={<Medal />}
        >
            <FoundersOverviewView 
                latestThreads={latestThreads} 
                memberSinceDate={memberSinceDate}
                contributionsCount={contributionsCount}
            />
        </PageWrapper>
    );
}
