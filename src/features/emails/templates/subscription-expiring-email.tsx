import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter } from '../lib/email-base';

interface SubscriptionExpiringEmailProps {
    firstName: string;
    planName: string;
    expiresAt: string;
    daysRemaining: number;
    renewUrl: string;
}

export function SubscriptionExpiringEmail({
    firstName,
    planName,
    expiresAt,
    daysRemaining,
    renewUrl,
}: Readonly<SubscriptionExpiringEmailProps>) {
    return (
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>Tu suscripción está por vencer</h1>

                <p style={emailBaseStyles.greeting}>Hola {firstName},</p>

                <p style={emailBaseStyles.text}>
                    Te escribimos para recordarte que tu suscripción al plan{' '}
                    <strong>{planName}</strong> vence en <strong>{daysRemaining} días</strong>.
                </p>

                <div style={emailBaseStyles.highlightBox}>
                    <p style={emailBaseStyles.highlightLabel}>Fecha de vencimiento</p>
                    <p style={emailBaseStyles.highlightValue}>{expiresAt}</p>
                </div>

                <p style={emailBaseStyles.text}>
                    Para continuar disfrutando de todas las funcionalidades sin
                    interrupciones, te recomendamos renovar tu suscripción antes
                    de la fecha de vencimiento.
                </p>

                <div style={emailBaseStyles.ctaContainer}>
                    <a href={renewUrl} style={emailBaseStyles.cta}>
                        Renovar Ahora
                    </a>
                </div>

                <div style={emailBaseStyles.noticeBox}>
                    <p style={emailBaseStyles.noticeText}>
                        <strong>Si no renovás:</strong> Tu cuenta pasará al plan Free,
                        perderás acceso a funcionalidades premium, pero tus datos se
                        mantendrán seguros por 30 días.
                    </p>
                </div>

                <p style={emailBaseStyles.smallText}>
                    Si tenés alguna pregunta sobre los planes o necesitás ayuda,
                    no dudes en contactarnos.
                </p>
            </div>

            <EmailFooter />
        </div>
    );
}
