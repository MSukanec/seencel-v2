import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getUserProfile } from "@/features/profile/queries";

export default async function FeaturesPage() {
    const { profile } = await getUserProfile();

    return (
        <div className="flex min-h-screen flex-col">
            <Header variant="public" user={profile} />
            <main className="flex-1 min-h-screen flex flex-col items-center justify-center p-24">
                <h1 className="text-4xl font-bold mb-4">Features</h1>
                <p className="text-muted-foreground">Coming soon...</p>
            </main>
            <Footer />
        </div>
    );
}
