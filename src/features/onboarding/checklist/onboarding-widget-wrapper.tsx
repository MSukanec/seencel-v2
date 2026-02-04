"use client";

import { usePathname } from "next/navigation";
import { OnboardingFloatingWidget } from "./onboarding-floating-widget";

/**
 * Conditional wrapper for OnboardingFloatingWidget
 * Only shows in organization and project contexts, NOT in:
 * - /academy
 * - /admin
 * - /checkout
 * - /community
 * - /hub
 * - /settings
 * - /maintenance
 */
export function OnboardingWidgetWrapper() {
    const pathname = usePathname();

    // Extract path without locale prefix (e.g., /es/organization -> /organization)
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');

    // Only show in organization and project contexts
    const isOrganizationContext = pathWithoutLocale.startsWith('/organization') ||
        pathWithoutLocale.startsWith('/organizacion');
    const isProjectContext = pathWithoutLocale.startsWith('/project/') ||
        pathWithoutLocale.startsWith('/proyecto/');

    if (!isOrganizationContext && !isProjectContext) {
        return null;
    }

    return <OnboardingFloatingWidget />;
}
