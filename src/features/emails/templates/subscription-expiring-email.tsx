import * as React from 'react';

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
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.logo}>
                    <span style={styles.logoText}>SEENCEL</span>
                </div>
            </div>

            {/* Content */}
            <div style={styles.content}>
                <div style={styles.warningIcon}>⏰</div>
                <h1 style={styles.title}>Tu suscripción está por vencer</h1>

                <p style={styles.greeting}>Hola {firstName},</p>

                <p style={styles.text}>
                    Te escribimos para recordarte que tu suscripción al plan{' '}
                    <strong>{planName}</strong> vence en{' '}
                    <strong style={{ color: '#f59e0b' }}>{daysRemaining} días</strong>.
                </p>

                <div style={styles.alertBox}>
                    <div style={styles.alertIcon}>⚠️</div>
                    <div style={styles.alertContent}>
                        <p style={styles.alertTitle}>Fecha de vencimiento</p>
                        <p style={styles.alertDate}>{expiresAt}</p>
                    </div>
                </div>

                <p style={styles.text}>
                    Para continuar disfrutando de todas las funcionalidades sin
                    interrupciones, te recomendamos renovar tu suscripción antes
                    de la fecha de vencimiento.
                </p>

                <div style={styles.ctaContainer}>
                    <a href={renewUrl} style={styles.cta}>
                        Renovar Ahora
                    </a>
                </div>

                <div style={styles.infoBox}>
                    <p style={styles.infoTitle}>¿Qué pasa si no renuevo?</p>
                    <ul style={styles.infoList}>
                        <li>Tu cuenta pasará al plan Free</li>
                        <li>Perderás acceso a funcionalidades premium</li>
                        <li>Tus datos se mantendrán seguros por 30 días</li>
                    </ul>
                </div>

                <p style={styles.smallText}>
                    Si tenés alguna pregunta sobre los planes o necesitás ayuda,
                    no dudes en contactarnos.
                </p>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
                <p style={styles.footerText}>
                    © {new Date().getFullYear()} Seencel. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
    },
    header: {
        backgroundColor: '#18181b',
        padding: '24px',
        textAlign: 'center' as const,
    },
    logo: {
        display: 'inline-block',
    },
    logoText: {
        color: '#ffffff',
        fontSize: '24px',
        fontWeight: 'bold',
        letterSpacing: '2px',
    },
    content: {
        padding: '32px 24px',
    },
    warningIcon: {
        fontSize: '48px',
        textAlign: 'center' as const,
        marginBottom: '16px',
    },
    title: {
        fontSize: '26px',
        fontWeight: 'bold',
        color: '#18181b',
        marginBottom: '24px',
        textAlign: 'center' as const,
    },
    greeting: {
        fontSize: '16px',
        color: '#374151',
        marginBottom: '16px',
    },
    text: {
        fontSize: '16px',
        color: '#4b5563',
        lineHeight: '1.6',
        marginBottom: '16px',
    },
    smallText: {
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.5',
        textAlign: 'center' as const,
    },
    alertBox: {
        backgroundColor: '#fffbeb',
        border: '1px solid #fcd34d',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    alertIcon: {
        fontSize: '32px',
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: '14px',
        color: '#92400e',
        margin: '0 0 4px 0',
    },
    alertDate: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#92400e',
        margin: '0',
    },
    ctaContainer: {
        textAlign: 'center' as const,
        margin: '32px 0',
    },
    cta: {
        display: 'inline-block',
        backgroundColor: '#f59e0b',
        color: '#ffffff',
        padding: '14px 32px',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '16px',
    },
    infoBox: {
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '24px',
    },
    infoTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginTop: '0',
        marginBottom: '8px',
    },
    infoList: {
        margin: '0',
        paddingLeft: '20px',
        color: '#6b7280',
        fontSize: '14px',
    },
    footer: {
        backgroundColor: '#f9fafb',
        padding: '24px',
        textAlign: 'center' as const,
        borderTop: '1px solid #e5e7eb',
    },
    footerText: {
        fontSize: '12px',
        color: '#9ca3af',
        margin: '0',
    },
};
