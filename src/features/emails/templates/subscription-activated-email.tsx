import * as React from 'react';

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
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.logo}>
                    <span style={styles.logoText}>SEENCEL</span>
                </div>
            </div>

            {/* Content */}
            <div style={styles.content}>
                <div style={styles.rocketIcon}>🚀</div>
                <h1 style={styles.title}>¡Tu Plan {planName} está Activo!</h1>

                <p style={styles.greeting}>Hola {firstName},</p>

                <p style={styles.text}>
                    Tu suscripción al plan <strong>{planName}</strong> ha sido activada
                    exitosamente. Ya tenés acceso a todas las funcionalidades incluidas
                    en tu plan.
                </p>

                <div style={styles.planCard}>
                    <div style={styles.planHeader}>
                        <span style={styles.planBadge}>{planName}</span>
                    </div>
                    <div style={styles.planDetails}>
                        <div style={styles.planRow}>
                            <span style={styles.planLabel}>Ciclo de facturación:</span>
                            <span style={styles.planValue}>{cycleLabels[billingCycle]}</span>
                        </div>
                        <div style={styles.planRow}>
                            <span style={styles.planLabel}>Válido hasta:</span>
                            <span style={styles.planValue}>{expiresAt}</span>
                        </div>
                    </div>
                </div>

                <div style={styles.features}>
                    <h3 style={styles.featuresTitle}>Lo que incluye tu plan:</h3>
                    <ul style={styles.featuresList}>
                        <li style={styles.featureItem}>✓ Proyectos ilimitados</li>
                        <li style={styles.featureItem}>✓ Miembros de equipo adicionales</li>
                        <li style={styles.featureItem}>✓ Reportes y analíticas avanzadas</li>
                        <li style={styles.featureItem}>✓ Soporte prioritario</li>
                        <li style={styles.featureItem}>✓ Almacenamiento expandido</li>
                    </ul>
                </div>

                <div style={styles.ctaContainer}>
                    <a href={dashboardUrl} style={styles.cta}>
                        Ir al Dashboard
                    </a>
                </div>

                <p style={styles.smallText}>
                    Gracias por confiar en Seencel para gestionar tus proyectos.
                    Estamos aquí para ayudarte a crecer.
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
    rocketIcon: {
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
        marginBottom: '24px',
    },
    smallText: {
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.5',
        textAlign: 'center' as const,
    },
    planCard: {
        backgroundColor: '#6366f1',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '24px',
    },
    planHeader: {
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
    },
    planBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        color: '#ffffff',
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '600',
    },
    planDetails: {
        padding: '16px 20px',
    },
    planRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
    },
    planLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: '14px',
    },
    planValue: {
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
    },
    features: {
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
    },
    featuresTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151',
        marginTop: '0',
        marginBottom: '16px',
    },
    featuresList: {
        listStyle: 'none',
        padding: '0',
        margin: '0',
    },
    featureItem: {
        color: '#22c55e',
        fontSize: '14px',
        padding: '6px 0',
    },
    ctaContainer: {
        textAlign: 'center' as const,
        margin: '32px 0',
    },
    cta: {
        display: 'inline-block',
        backgroundColor: '#6366f1',
        color: '#ffffff',
        padding: '14px 32px',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '16px',
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
