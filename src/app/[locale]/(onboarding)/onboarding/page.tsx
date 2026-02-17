import { createClient } from "@/lib/supabase/server";
import { getCountries } from "@/features/countries/queries";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
    // Require authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        const { redirect } = await import('next/navigation');
        return redirect('/login');
    }

    const countries = await getCountries();

    return <OnboardingForm countries={countries} />;
}
