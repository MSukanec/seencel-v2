import * as React from 'react';

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
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.logo}>
                    <span style={styles.logoText}>SEENCEL</span>
                </div>
            </div>

            {/* Content */}
            <div style={styles.content}>
                <div style={styles.successIcon}>✓</div>
                <h1 style={styles.title}>¡Transferencia Verificada!</h1>

                <p style={styles.greeting}>Hola {firstName},</p>

                <p style={styles.text}>
                    Hemos verificado tu transferencia bancaria exitosamente.
                    Tu suscripción al plan <strong>{planName}</strong> ya está activa.
                </p>

                <div style={styles.verificationCard}>
                    <div style={styles.verificationHeader}>
                        <span style={styles.verificationBadge}>Pago Verificado</span>
                    </div>
                    <div style={styles.verificationDetails}>
                        <div style={styles.verificationRow}>
                            <span style={styles.verificationLabel}>Plan:</span>
                            <span style={styles.verificationValue}>{planName}</span>
                        </div>
                        <div style={styles.verificationRow}>
                            <span style={styles.verificationLabel}>Monto:</span>
                            <span style={styles.verificationValue}>{currency} {amount}</span>
                        </div>
                        <div style={styles.verificationRow}>
                            <span style={styles.verificationLabel}>Verificado el:</span>
                            <span style={styles.verificationValue}>{verifiedAt}</span>
                        </div>
                    </div>
                </div>

                <p style={styles.text}>
                    Ya podés disfrutar de todas las funcionalidades de tu plan.
                    Gracias por elegir Seencel para gestionar tus proyectos.
                </p>

                <div style={styles.ctaContainer}>
                    <a href="https://seencel.com/dashboard" style={styles.cta}>
                        Ir al Dashboard
                    </a>
                </div>

                <p style={styles.smallText}>
                    Recibirás un recordatorio antes de que tu suscripción expire.
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
    successIcon: {
        width: '64px',
        height: '64px',
        backgroundColor: '#22c55e',
        color: '#ffffff',
        borderRadius: '50%',
        fontSize: '32px',
        fontWeight: 'bold',
        margin: '0 auto 24px',
        textAlign: 'center' as const,
        lineHeight: '64px',
    },
    title: {
        fontSize: '28px',
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
        color: '#9ca3af',
        lineHeight: '1.5',
        textAlign: 'center' as const,
    },
    verificationCard: {
        backgroundColor: '#f0fdf4',
        border: '2px solid #22c55e',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '24px',
    },
    verificationHeader: {
        backgroundColor: '#22c55e',
        padding: '12px 20px',
    },
    verificationBadge: {
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
    },
    verificationDetails: {
        padding: '16px 20px',
    },
    verificationRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #dcfce7',
    },
    verificationLabel: {
        color: '#166534',
        fontSize: '14px',
    },
    verificationValue: {
        color: '#14532d',
        fontSize: '14px',
        fontWeight: '600',
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
