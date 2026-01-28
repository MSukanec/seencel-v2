import * as React from 'react';

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
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.logo}>
                    <span style={styles.logoText}>SEENCEL</span>
                </div>
            </div>

            {/* Content */}
            <div style={styles.content}>
                <div style={styles.expiredIcon}>📭</div>
                <h1 style={styles.title}>Tu suscripción ha expirado</h1>

                <p style={styles.greeting}>Hola {firstName},</p>

                <p style={styles.text}>
                    Tu suscripción al plan <strong>{planName}</strong> expiró el{' '}
                    <strong>{expiredAt}</strong>. Tu cuenta ha sido cambiada al plan Free.
                </p>

                <div style={styles.statusBox}>
                    <div style={styles.statusRow}>
                        <span style={styles.statusLabel}>Estado anterior:</span>
                        <span style={styles.statusOld}>{planName}</span>
                    </div>
                    <div style={styles.statusArrow}>↓</div>
                    <div style={styles.statusRow}>
                        <span style={styles.statusLabel}>Estado actual:</span>
                        <span style={styles.statusNew}>Free</span>
                    </div>
                </div>

                <div style={styles.impactBox}>
                    <p style={styles.impactTitle}>Lo que ya no tenés acceso:</p>
                    <ul style={styles.impactList}>
                        <li style={styles.impactItem}>❌ Proyectos adicionales</li>
                        <li style={styles.impactItem}>❌ Miembros extra de equipo</li>
                        <li style={styles.impactItem}>❌ Reportes avanzados</li>
                        <li style={styles.impactItem}>❌ Almacenamiento expandido</li>
                    </ul>
                </div>

                <p style={styles.text}>
                    <strong>Buenas noticias:</strong> Todos tus datos están seguros.
                    Podés reactivar tu suscripción en cualquier momento y recuperar
                    el acceso completo inmediatamente.
                </p>

                <div style={styles.ctaContainer}>
                    <a href={reactivateUrl} style={styles.cta}>
                        Reactivar Suscripción
                    </a>
                </div>

                <p style={styles.smallText}>
                    Tus datos se mantendrán almacenados por 30 días. Después de ese
                    período, los datos que excedan el límite del plan Free podrían
                    ser archivados.
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
    expiredIcon: {
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
        fontSize: '13px',
        color: '#9ca3af',
        lineHeight: '1.5',
        textAlign: 'center' as const,
    },
    statusBox: {
        backgroundColor: '#f3f4f6',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        textAlign: 'center' as const,
    },
    statusRow: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
    },
    statusLabel: {
        fontSize: '14px',
        color: '#6b7280',
    },
    statusOld: {
        backgroundColor: '#dc2626',
        color: '#ffffff',
        padding: '4px 12px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '600',
        textDecoration: 'line-through',
    },
    statusArrow: {
        fontSize: '24px',
        color: '#9ca3af',
        margin: '8px 0',
    },
    statusNew: {
        backgroundColor: '#e5e7eb',
        color: '#374151',
        padding: '4px 12px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '600',
    },
    impactBox: {
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '24px',
    },
    impactTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#991b1b',
        marginTop: '0',
        marginBottom: '12px',
    },
    impactList: {
        listStyle: 'none',
        margin: '0',
        padding: '0',
    },
    impactItem: {
        color: '#b91c1c',
        fontSize: '14px',
        padding: '4px 0',
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
