import * as React from 'react';

/**
 * Shared base styles for all email templates
 * Design: Professional, minimal, no emojis, logo at top
 */
export const emailBaseStyles: Record<string, React.CSSProperties> = {
    // Container
    container: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        maxWidth: '520px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
    },

    // Header with logo
    header: {
        padding: '32px 24px',
        textAlign: 'center' as const,
        borderBottom: '1px solid #e5e7eb',
    },
    logo: {
        width: '40px',
        height: '40px',
    },

    // Content
    content: {
        padding: '32px 24px',
    },
    title: {
        fontSize: '22px',
        fontWeight: '600',
        color: '#18181b',
        marginBottom: '20px',
        marginTop: '0',
        textAlign: 'center' as const,
    },
    greeting: {
        fontSize: '15px',
        color: '#374151',
        marginBottom: '16px',
    },
    text: {
        fontSize: '15px',
        color: '#52525b',
        lineHeight: '1.6',
        marginBottom: '16px',
    },
    smallText: {
        fontSize: '13px',
        color: '#71717a',
        lineHeight: '1.5',
    },

    // Info Card (neutral gray)
    card: {
        backgroundColor: '#f4f4f5',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
    },
    cardTitle: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#52525b',
        marginBottom: '12px',
        marginTop: '0',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    cardRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
        borderBottom: '1px solid #e4e4e7',
    },
    cardRowLast: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
    },
    cardLabel: {
        fontSize: '14px',
        color: '#71717a',
    },
    cardValue: {
        fontSize: '14px',
        color: '#18181b',
        fontWeight: '500',
    },
    cardValueMono: {
        fontSize: '14px',
        color: '#18181b',
        fontWeight: '500',
        fontFamily: 'monospace',
    },
    cardTotal: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 0 0',
        marginTop: '12px',
        borderTop: '1px solid #d4d4d8',
    },
    cardTotalLabel: {
        fontSize: '15px',
        color: '#18181b',
        fontWeight: '600',
    },
    cardTotalValue: {
        fontSize: '18px',
        color: '#18181b',
        fontWeight: '700',
    },

    // Highlight box (for important info like references)
    highlightBox: {
        backgroundColor: '#fafafa',
        border: '1px solid #e4e4e7',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        textAlign: 'center' as const,
    },
    highlightLabel: {
        fontSize: '12px',
        color: '#71717a',
        marginBottom: '8px',
        marginTop: '0',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    highlightValue: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#18181b',
        fontFamily: 'monospace',
        margin: '0',
        letterSpacing: '1px',
    },

    // Notice box (for warnings/important dates)
    noticeBox: {
        backgroundColor: '#fafafa',
        border: '1px solid #e4e4e7',
        borderRadius: '8px',
        padding: '14px 16px',
        marginBottom: '24px',
    },
    noticeText: {
        fontSize: '14px',
        color: '#52525b',
        margin: '0',
        lineHeight: '1.5',
    },

    // Steps list
    stepsList: {
        margin: '0 0 24px',
        paddingLeft: '20px',
        color: '#52525b',
        fontSize: '14px',
        lineHeight: '2',
    },

    // CTA Button
    ctaContainer: {
        textAlign: 'center' as const,
        margin: '28px 0',
    },
    cta: {
        display: 'inline-block',
        backgroundColor: '#18181b',
        color: '#ffffff',
        padding: '12px 28px',
        borderRadius: '6px',
        textDecoration: 'none',
        fontWeight: '500',
        fontSize: '14px',
    },

    // Footer
    footer: {
        padding: '24px',
        textAlign: 'center' as const,
        borderTop: '1px solid #e5e7eb',
    },
    footerText: {
        fontSize: '12px',
        color: '#a1a1aa',
        margin: '0 0 8px',
    },
    footerLinks: {
        fontSize: '12px',
        margin: '0',
    },
    footerLink: {
        color: '#71717a',
        textDecoration: 'none',
    },
};

/**
 * Email header component with logo
 */
export function EmailHeader() {
    return (
        <div style={emailBaseStyles.header}>
            <img
                src="https://seencel.com/logo.png"
                alt="SEENCEL"
                width="40"
                height="40"
                style={emailBaseStyles.logo}
            />
        </div>
    );
}

/**
 * Email footer component
 */
export function EmailFooter() {
    return (
        <div style={emailBaseStyles.footer}>
            <p style={emailBaseStyles.footerText}>
                © {new Date().getFullYear()} SEENCEL. Todos los derechos reservados.
            </p>
            <p style={emailBaseStyles.footerLinks}>
                <a href="https://seencel.com/privacy" style={emailBaseStyles.footerLink}>Privacidad</a>
                {' • '}
                <a href="https://seencel.com/terms" style={emailBaseStyles.footerLink}>Términos</a>
            </p>
        </div>
    );
}
