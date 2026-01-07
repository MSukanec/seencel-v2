import { getUserProfile } from "@/features/profile/queries";
import { ContactView } from "@/features/contact/components/contact-view";
import { LayoutSwitcher } from "@/components/layout/layout-switcher";
import { Header } from "@/components/layout/header";

export default async function ContactPage() {
    // 1. Check if user is logged in
    const { profile } = await getUserProfile();

    // 2. If logged in -> Show with Dashboard Layout (Sidebar, etc.)
    if (profile) {
        return (
            <LayoutSwitcher user={profile}>
                <ContactView />
            </LayoutSwitcher>
        );
    }

    // 3. If NOT logged in -> Show with Public Layout (Header only)
    return (
        <div className="flex min-h-screen flex-col">
            <Header variant="public" />
            <main className="flex-1">
                <ContactView />
            </main>
            {/* <Footer /> */}
        </div>
    );
}
