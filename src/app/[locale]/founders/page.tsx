import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { getUserProfile } from "@/features/users/queries";
import { FoundersContent } from "@/features/founders/components/founders-content";

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
