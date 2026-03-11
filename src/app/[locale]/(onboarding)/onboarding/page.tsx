import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { getCountries } from "@/features/countries/queries";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
    const authUser = await getAuthUser();

    if (!authUser) {
        const { redirect } = await import('next/navigation');
        return redirect('/login');
    }

    // Guard anti-repetición: si ya completó onboarding, redirigir al hub
    const supabase = await createClient();
    const { data: internalUser } = await supabase
        .schema('iam').from('users')
        .select('id, full_name, signup_completed, user_data(first_name, last_name, country)')
        .eq('auth_id', authUser.id)
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
