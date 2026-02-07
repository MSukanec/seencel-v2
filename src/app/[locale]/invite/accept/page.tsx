import type { Metadata } from "next";
import { getInvitationByToken } from "@/features/team/actions";
import { createClient } from "@/lib/supabase/server";
import { AcceptInvitationClient } from "./accept-invitation-client";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Aceptar Invitación | SEENCEL",
        description: "Aceptá la invitación para unirte a un equipo en SEENCEL",
        robots: "noindex, nofollow",
    };
}

interface Props {
    searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitationPage({ searchParams }: Props) {
    const { token } = await searchParams;

    if (!token) {
        return (
            <InvitationLayout>
                <InvitationError
                    title="Link inválido"
                    message="El link de invitación no es válido. Verificá que copiaste el link completo del email."
                />
            </InvitationLayout>
        );
    }

    // Get invitation details
    const invitation = await getInvitationByToken(token);

    if (!invitation.success || !invitation.data) {
        return (
            <InvitationLayout>
                <InvitationError
                    title="Invitación no encontrada"
                    message="Esta invitación no existe o el link es incorrecto."
                />
            </InvitationLayout>
        );
    }

    const inv = invitation.data;

    // Check if expired
    if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
        return (
            <InvitationLayout>
                <InvitationError
                    title="Invitación expirada"
                    message="Esta invitación ha expirado. Pedí al administrador que te envíe una nueva."
                />
            </InvitationLayout>
        );
    }

    // Check if already used
    if (inv.status === 'accepted') {
        return (
            <InvitationLayout>
                <InvitationError
                    title="Invitación ya aceptada"
                    message="Esta invitación ya fue utilizada."
                />
            </InvitationLayout>
        );
    }

    if (inv.status === 'rejected') {
        return (
            <InvitationLayout>
                <InvitationError
                    title="Invitación rechazada"
                    message="Esta invitación fue rechazada."
                />
            </InvitationLayout>
        );
    }

    // Check if user is authenticated
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // Get organization logo from invitation
    let organizationLogo: string | null = null;
    const { data: invitationWithOrg } = await supabase
        .from('organization_invitations')
        .select('organization_id, organizations!inner(logo_path)')
        .eq('token', token)
        .single();

    if (invitationWithOrg?.organizations) {
        const org = invitationWithOrg.organizations as unknown as { logo_path: string | null };
        if (org.logo_path) {
            // Build full storage URL
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            organizationLogo = org.logo_path.startsWith('http')
                ? org.logo_path
                : `${supabaseUrl}/storage/v1/object/public/public-assets/${org.logo_path}`;
        }
    }

    return (
        <InvitationLayout>
            <AcceptInvitationClient
                token={token}
                organizationName={inv.organization_name}
                organizationLogo={organizationLogo}
                roleName={inv.role_name}
                inviterName={inv.inviter_name}
                email={inv.email}
                isAuthenticated={!!authUser}
            />
        </InvitationLayout>
    );
}

// ============================================================
// Layout wrapper
// ============================================================

function InvitationLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <img
                        src="/logo.png"
                        alt="SEENCEL"
                        className="w-10 h-10 mx-auto mb-3"
                    />
                    <p className="text-xs text-muted-foreground tracking-widest uppercase">SEENCEL</p>
                </div>
                {children}
            </div>
        </div>
    );
}

// ============================================================
// Error state
// ============================================================

function InvitationError({ title, message }: { title: string; message: string }) {
    return (
        <div className="rounded-xl border bg-card p-8 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="text-muted-foreground text-sm">{message}</p>
            <a
                href="/"
                className="inline-block mt-4 text-sm text-primary hover:underline"
            >
                Ir al inicio
            </a>
        </div>
    );
}
