import { createClient } from "@/lib/supabase/server";
import { getCountries } from "@/features/countries/queries";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        const { redirect } = await import('next/navigation');
        return redirect('/login');
    }

    // Guard anti-repetición: si ya completó onboarding, redirigir al hub
    const { data: internalUser } = await supabase
        .schema('iam').from('users')
        .select('id, full_name, signup_completed, user_data(first_name, last_name, country)')
        .eq('auth_id', user.id)
        .single();

    if (internalUser?.signup_completed) {
        const { redirect } = await import('next/navigation');
        return redirect('/hub');
    }

    // Pre-fill: si viene de Google/provider, full_name ya existe
    const userData = Array.isArray(internalUser?.user_data)
        ? internalUser?.user_data[0]
        : internalUser?.user_data;

    const defaultValues = {
        firstName: userData?.first_name || '',
        lastName: userData?.last_name || '',
        countryId: userData?.country || '',
    };

    const countries = await getCountries();

    return <OnboardingForm countries={countries} defaultValues={defaultValues} />;
}
