import * as React from 'react';

interface PurchaseConfirmationEmailProps {
    firstName: string;
    planName: string;
    billingCycle: 'monthly' | 'annual';
    amount: string;
    currency: string;
    paymentMethod: 'mercadopago' | 'paypal' | 'bank_transfer';
    transactionId: string;
    purchaseDate: string;
}

export function PurchaseConfirmationEmail({
    firstName,
    planName,
    billingCycle,
    amount,
    currency,
    paymentMethod,
    transactionId,
    purchaseDate,
}: Readonly<PurchaseConfirmationEmailProps>) {
    const paymentMethodLabels = {
        mercadopago: 'MercadoPago',
        paypal: 'PayPal',
        bank_transfer: 'Transferencia Bancaria',
    };

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
                <div style={styles.successIcon}>✓</div>
                <h1 style={styles.title}>¡Pago Confirmado!</h1>

                <p style={styles.greeting}>Hola {firstName},</p>

                <p style={styles.text}>
                    Tu pago ha sido procesado exitosamente. A continuación encontrarás
                    los detalles de tu compra:
                </p>

                <div style={styles.invoice}>
                    <h2 style={styles.invoiceTitle}>Detalle de Compra</h2>

                    <div style={styles.invoiceRow}>
                        <span style={styles.invoiceLabel}>Plan:</span>
                        <span style={styles.invoiceValue}>{planName}</span>
                    </div>

                    <div style={styles.invoiceRow}>
                        <span style={styles.invoiceLabel}>Ciclo:</span>
                        <span style={styles.invoiceValue}>{cycleLabels[billingCycle]}</span>
                    </div>

                    <div style={styles.invoiceRow}>
                        <span style={styles.invoiceLabel}>Método de pago:</span>
                        <span style={styles.invoiceValue}>{paymentMethodLabels[paymentMethod]}</span>
                    </div>

                    <div style={styles.invoiceRow}>
                        <span style={styles.invoiceLabel}>Fecha:</span>
                        <span style={styles.invoiceValue}>{purchaseDate}</span>
                    </div>

                    <div style={styles.invoiceRow}>
                        <span style={styles.invoiceLabel}>ID de Transacción:</span>
                        <span style={styles.invoiceValue}>{transactionId}</span>
                    </div>

                    <div style={styles.invoiceDivider} />

                    <div style={styles.invoiceTotal}>
                        <span style={styles.totalLabel}>Total:</span>
                        <span style={styles.totalValue}>{currency} {amount}</span>
                    </div>
                </div>

                <div style={styles.ctaContainer}>
                    <a href="https://seencel.com/organization/billing" style={styles.cta}>
                        Ver Mi Suscripción
                    </a>
                </div>

                <p style={styles.text}>
                    Tu suscripción ya está activa. Podés empezar a usar todas las
                    funcionalidades de tu plan {planName} desde ahora.
                </p>

                <p style={styles.smallText}>
                    Si tenés alguna pregunta sobre tu compra, no dudes en contactarnos.
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
        color: '#6b7280',
        lineHeight: '1.5',
    },
    invoice: {
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e5e7eb',
    },
    invoiceTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#111827',
        marginTop: '0',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid #e5e7eb',
    },
    invoiceRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
    },
    invoiceLabel: {
        fontSize: '14px',
        color: '#6b7280',
    },
    invoiceValue: {
        fontSize: '14px',
        color: '#111827',
        fontWeight: '500',
    },
    invoiceDivider: {
        height: '1px',
        backgroundColor: '#e5e7eb',
        margin: '16px 0',
    },
    invoiceTotal: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
    },
    totalLabel: {
        fontSize: '16px',
        color: '#111827',
        fontWeight: '600',
    },
    totalValue: {
        fontSize: '20px',
        color: '#22c55e',
        fontWeight: 'bold',
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
