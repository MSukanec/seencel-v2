import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ClientPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/es/login?redirect=/portal");
    }

    return (
        <div className="min-h-screen bg-background">
            {children}
        </div>
    );
}
