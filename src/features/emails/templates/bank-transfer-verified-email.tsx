import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter } from '../lib/email-base';

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

                    <div style={emailBaseStyles.cardRow}>
                        <span style={emailBaseStyles.cardLabel}>Plan</span>
                        <span style={emailBaseStyles.cardValue}>{planName}</span>
                    </div>

                    <div style={emailBaseStyles.cardRow}>
                        <span style={emailBaseStyles.cardLabel}>Monto</span>
                        <span style={emailBaseStyles.cardValue}>{currency} {amount}</span>
                    </div>

                    <div style={emailBaseStyles.cardRowLast}>
                        <span style={emailBaseStyles.cardLabel}>Verificado el</span>
                        <span style={emailBaseStyles.cardValue}>{verifiedAt}</span>
                    </div>
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
