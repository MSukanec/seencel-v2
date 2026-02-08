import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter, EmailCardRow } from '../lib/email-base';

interface SubscriptionActivatedEmailProps {
    firstName: string;
    planName: string;
    billingCycle: 'monthly' | 'annual';
    expiresAt: string;
    dashboardUrl: string;
}

export function SubscriptionActivatedEmail({
    firstName,
    planName,
    billingCycle,
    expiresAt,
    dashboardUrl,
}: Readonly<SubscriptionActivatedEmailProps>) {
    const cycleLabels = {
        monthly: 'Mensual',
        annual: 'Anual',
    };

    return (
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>Tu Plan {planName} está Activo</h1>

                <p style={emailBaseStyles.greeting}>Hola {firstName},</p>

                <p style={emailBaseStyles.text}>
                    Tu suscripción al plan <strong>{planName}</strong> ha sido activada
                    exitosamente. Ya tenés acceso a todas las funcionalidades incluidas
                    en tu plan.
                </p>

                <div style={emailBaseStyles.card}>
                    <h3 style={emailBaseStyles.cardTitle}>Detalles de tu Plan</h3>

                    <EmailCardRow label="Plan" value={planName} />
                    <EmailCardRow label="Ciclo de facturación" value={cycleLabels[billingCycle]} />
                    <EmailCardRow label="Válido hasta" value={expiresAt} last />
                </div>

                <div style={emailBaseStyles.ctaContainer}>
                    <a href={dashboardUrl} style={emailBaseStyles.cta}>
                        Ir al Dashboard
                    </a>
                </div>

                <p style={emailBaseStyles.smallText}>
                    Gracias por confiar en SEENCEL para gestionar tus proyectos.
                    Estamos aquí para ayudarte a crecer.
                </p>
            </div>

            <EmailFooter />
        </div>
    );
}
