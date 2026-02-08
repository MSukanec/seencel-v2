import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter, EmailCardRow } from '../lib/email-base';

interface BankTransferVerifiedEmailProps {
    firstName: string;
    planName: string;
    amount: string;
    currency: string;
    verifiedAt: string;
}

export function BankTransferVerifiedEmail({
    firstName,
    planName,
    amount,
    currency,
    verifiedAt,
}: Readonly<BankTransferVerifiedEmailProps>) {
    return (
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>Transferencia Verificada</h1>

                <p style={emailBaseStyles.greeting}>Hola {firstName},</p>

                <p style={emailBaseStyles.text}>
                    Hemos verificado tu transferencia bancaria exitosamente.
                    Tu suscripción al plan <strong>{planName}</strong> ya está activa.
                </p>

                <div style={emailBaseStyles.card}>
                    <h3 style={emailBaseStyles.cardTitle}>Resumen del Pago</h3>

                    <EmailCardRow label="Plan" value={planName} />
                    <EmailCardRow label="Monto" value={`${currency} ${amount}`} />
                    <EmailCardRow label="Verificado el" value={verifiedAt} last />
                </div>

                <p style={emailBaseStyles.text}>
                    Ya podés disfrutar de todas las funcionalidades de tu plan.
                    Gracias por elegir SEENCEL para gestionar tus proyectos.
                </p>

                <div style={emailBaseStyles.ctaContainer}>
                    <a href="https://seencel.com/hub" style={emailBaseStyles.cta}>
                        Ir al Dashboard
                    </a>
                </div>

                <p style={emailBaseStyles.smallText}>
                    Recibirás un recordatorio antes de que tu suscripción expire.
                </p>
            </div>

            <EmailFooter />
        </div>
    );
}
