/**
 * Organization Layout
 *
 * Auth guard is handled by parent DashboardLayout.
 * Org guard (no org → /workspace-setup) is handled by DashboardLayout's
 * onboarding check (signup_completed).
 *
 * This layout is a pass-through — it exists only as a route group boundary.
 * All queries were removed because they were redundant with DashboardLayout.
 */
export default function OrganizationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
