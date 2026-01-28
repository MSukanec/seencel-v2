import * as React from 'react';

interface WelcomeEmailProps {
    firstName: string;
    email: string;
}

export function WelcomeEmail({ firstName, email }: Readonly<WelcomeEmailProps>) {
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
                <h1 style={styles.title}>¡Bienvenido a Seencel! 🎉</h1>

                <p style={styles.greeting}>Hola {firstName},</p>

                <p style={styles.text}>
                    Tu cuenta ha sido creada exitosamente. Ahora sos parte de la comunidad
                    de profesionales de la construcción que están transformando la forma
                    de gestionar sus proyectos.
                </p>

                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Tu cuenta</h3>
                    <p style={styles.cardText}>
                        <strong>Email:</strong> {email}
                    </p>
                </div>

                <div style={styles.features}>
                    <h3 style={styles.featuresTitle}>¿Qué podés hacer ahora?</h3>
                    <ul style={styles.featuresList}>
                        <li style={styles.featureItem}>📊 Crear tu primera organización</li>
                        <li style={styles.featureItem}>🏗️ Agregar proyectos de construcción</li>
                        <li style={styles.featureItem}>👥 Invitar a tu equipo</li>
                        <li style={styles.featureItem}>📈 Monitorear presupuestos y avances</li>
                    </ul>
                </div>

                <div style={styles.ctaContainer}>
                    <a href="https://seencel.com/dashboard" style={styles.cta}>
                        Ir al Dashboard
                    </a>
                </div>

                <p style={styles.text}>
                    Si tenés alguna pregunta, no dudes en contactarnos respondiendo
                    a este email o visitando nuestra sección de ayuda.
                </p>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
                <p style={styles.footerText}>
                    © {new Date().getFullYear()} Seencel. Todos los derechos reservados.
                </p>
                <p style={styles.footerLinks}>
                    <a href="https://seencel.com/privacy" style={styles.footerLink}>Privacidad</a>
                    {' • '}
                    <a href="https://seencel.com/terms" style={styles.footerLink}>Términos</a>
                    {' • '}
                    <a href="https://seencel.com/contact" style={styles.footerLink}>Contacto</a>
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
    card: {
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
    },
    cardTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '8px',
        marginTop: '0',
    },
    cardText: {
        fontSize: '14px',
        color: '#6b7280',
        margin: '0',
    },
    features: {
        marginBottom: '24px',
    },
    featuresTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '12px',
    },
    featuresList: {
        listStyle: 'none',
        padding: '0',
        margin: '0',
    },
    featureItem: {
        fontSize: '14px',
        color: '#4b5563',
        padding: '8px 0',
        borderBottom: '1px solid #e5e7eb',
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
        marginBottom: '8px',
    },
    footerLinks: {
        fontSize: '12px',
        margin: '0',
    },
    footerLink: {
        color: '#6b7280',
        textDecoration: 'none',
    },
};
