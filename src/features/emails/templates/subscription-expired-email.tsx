import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter, EmailCardRow } from '../lib/email-base';

interface SubscriptionExpiredEmailProps {
    firstName: string;
    planName: string;
    expiredAt: string;
    reactivateUrl: string;
}

export function SubscriptionExpiredEmail({
    firstName,
    planName,
    expiredAt,
    reactivateUrl,
}: Readonly<SubscriptionExpiredEmailProps>) {
    return (
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>Tu suscripción ha expirado</h1>

                <p style={emailBaseStyles.greeting}>Hola {firstName},</p>

                <p style={emailBaseStyles.text}>
                    Tu suscripción al plan <strong>{planName}</strong> expiró el{' '}
                    <strong>{expiredAt}</strong>. Tu cuenta ha sido cambiada al plan Free.
                </p>

                <div style={emailBaseStyles.card}>
                    <h3 style={emailBaseStyles.cardTitle}>Cambio de Estado</h3>

                    <EmailCardRow label="Estado anterior" value={planName} />
                    <EmailCardRow label="Estado actual" value="Free" last />
                </div>

                <div style={emailBaseStyles.noticeBox}>
                    <p style={emailBaseStyles.noticeText}>
                        El plan Free tiene limitaciones en cantidad de proyectos, miembros de equipo,
                        reportes y almacenamiento. Sin embargo, todos tus datos están seguros.
                    </p>
                </div>

                <p style={emailBaseStyles.text}>
                    Podés reactivar tu suscripción en cualquier momento y recuperar
                    el acceso completo inmediatamente.
                </p>

                <div style={emailBaseStyles.ctaContainer}>
                    <a href={reactivateUrl} style={emailBaseStyles.cta}>
                        Reactivar Suscripción
                    </a>
                </div>

                <p style={emailBaseStyles.smallText}>
                    Tus datos se mantendrán almacenados por 30 días. Después de ese
                    período, los datos que excedan el límite del plan Free podrían
                    ser archivados.
                </p>
            </div>

            <EmailFooter />
        </div>
    );
}
