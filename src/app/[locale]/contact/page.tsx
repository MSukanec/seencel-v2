import { getUserProfile } from "@/features/profile/queries";
// import { ContactView } from "@/features/contact/components/contact-view";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";

export default async function ContactPage() {
    const { profile } = await getUserProfile();

    return (
        <div className="flex min-h-screen flex-col">
            <Header variant="public" user={profile} />
            <main className="flex-1 min-h-screen container py-10">
                <h1 className="text-2xl font-bold">Contacto</h1>
                <p className="text-muted-foreground">Próximamente</p>
            </main>
            <Footer />
        </div>
    );
}

