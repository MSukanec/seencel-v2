import { headers } from "next/headers";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
    const headersList = await headers();
    const countryCode = headersList.get("x-vercel-ip-country") || undefined;

    return <OnboardingForm countryCode={countryCode} />;
}
