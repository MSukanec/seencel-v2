import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
    const headersList = await headers();
    const countryCode = headersList.get("x-vercel-ip-country") || undefined;

    // Fetch existing organization name if available
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let organizationName: string | undefined;

    if (user) {
        // Get internal user ID
        const { data: internalUser } = await supabase
            .from("users")
            .select("id")
            .eq("auth_id", user.id)
            .single();

        if (internalUser) {
            // Get the organization created by the signup trigger
            const { data: org } = await supabase
                .from("organizations")
                .select("name")
                .eq("owner_id", internalUser.id)
                .order("created_at", { ascending: true })
                .limit(1)
                .single();

            organizationName = org?.name;
        }
    }

    return <OnboardingForm countryCode={countryCode} organizationName={organizationName} />;
}
