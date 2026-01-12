import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getUserProfile } from "@/features/profile/queries";
import { FoundersContent } from "@/components/founders/founders-content";

export default async function FoundersPage() {
    const { profile } = await getUserProfile();

    return (
        <div className="flex min-h-screen flex-col">
            <Header variant="public" user={profile} />
            <main className="flex-1">
                <FoundersContent isDashboard={false} />
            </main>
            <Footer />
        </div>
    );
}
