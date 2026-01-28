import * as React from 'react';

interface BankTransferPendingEmailProps {
    firstName: string;
    planName: string;
    amount: string;
    currency: string;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    reference: string;
    expiresAt: string;
}

export function BankTransferPendingEmail({
    firstName,
    planName,
    amount,
    currency,
    bankName,
    accountHolder,
    accountNumber,
    reference,
    expiresAt,
}: Readonly<BankTransferPendingEmailProps>) {
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
                <div style={styles.pendingIcon}>🏦</div>
                <h1 style={styles.title}>Instrucciones de Transferencia</h1>

                <p style={styles.greeting}>Hola {firstName},</p>

                <p style={styles.text}>
                    Has elegido pagar tu suscripción <strong>{planName}</strong> mediante
                    transferencia bancaria. A continuación te dejamos los datos para
                    realizar el pago:
                </p>

                <div style={styles.bankCard}>
                    <h2 style={styles.bankTitle}>Datos Bancarios</h2>

                    <div style={styles.bankRow}>
                        <span style={styles.bankLabel}>Banco:</span>
                        <span style={styles.bankValue}>{bankName}</span>
                    </div>

                    <div style={styles.bankRow}>
                        <span style={styles.bankLabel}>Titular:</span>
                        <span style={styles.bankValue}>{accountHolder}</span>
                    </div>

                    <div style={styles.bankRow}>
                        <span style={styles.bankLabel}>CBU / Cuenta:</span>
                        <span style={styles.bankValueMono}>{accountNumber}</span>
                    </div>

                    <div style={styles.bankDivider} />

                    <div style={styles.bankRow}>
                        <span style={styles.bankLabel}>Monto a transferir:</span>
                        <span style={styles.bankAmount}>{currency} {amount}</span>
                    </div>
                </div>

                <div style={styles.referenceBox}>
                    <p style={styles.referenceTitle}>
                        🔑 Referencia obligatoria (incluir en descripción):
                    </p>
                    <p style={styles.referenceValue}>{reference}</p>
                </div>

                <div style={styles.warningBox}>
                    <p style={styles.warningText}>
                        ⏰ <strong>Importante:</strong> Esta solicitud vence el{' '}
                        <strong>{expiresAt}</strong>. Después de esa fecha, deberás
                        generar una nueva orden de pago.
                    </p>
                </div>

                <div style={styles.steps}>
                    <h3 style={styles.stepsTitle}>Próximos pasos:</h3>
                    <ol style={styles.stepsList}>
                        <li style={styles.stepItem}>Realizá la transferencia con los datos indicados</li>
                        <li style={styles.stepItem}>Incluí el código de referencia en el concepto</li>
                        <li style={styles.stepItem}>Te enviaremos un email cuando verifiquemos el pago</li>
                        <li style={styles.stepItem}>Tu suscripción se activará automáticamente</li>
                    </ol>
                </div>

                <p style={styles.smallText}>
                    La verificación puede demorar entre 24 y 48 horas hábiles.
                    Si tenés dudas, respondé a este email.
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
    pendingIcon: {
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
        fontSize: '13px',
        color: '#9ca3af',
        lineHeight: '1.5',
        textAlign: 'center' as const,
    },
    bankCard: {
        backgroundColor: '#f0fdf4',
        border: '2px solid #22c55e',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
    },
    bankTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#166534',
        marginTop: '0',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid #bbf7d0',
    },
    bankRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
    },
    bankLabel: {
        fontSize: '14px',
        color: '#166534',
    },
    bankValue: {
        fontSize: '14px',
        color: '#14532d',
        fontWeight: '600',
    },
    bankValueMono: {
        fontSize: '14px',
        color: '#14532d',
        fontWeight: '600',
        fontFamily: 'monospace',
    },
    bankAmount: {
        fontSize: '18px',
        color: '#15803d',
        fontWeight: 'bold',
    },
    bankDivider: {
        height: '1px',
        backgroundColor: '#bbf7d0',
        margin: '16px 0',
    },
    referenceBox: {
        backgroundColor: '#fef3c7',
        border: '1px solid #fcd34d',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '24px',
        textAlign: 'center' as const,
    },
    referenceTitle: {
        fontSize: '14px',
        color: '#92400e',
        margin: '0 0 8px 0',
    },
    referenceValue: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#78350f',
        fontFamily: 'monospace',
        margin: '0',
        letterSpacing: '2px',
    },
    warningBox: {
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '24px',
    },
    warningText: {
        fontSize: '14px',
        color: '#991b1b',
        margin: '0',
    },
    steps: {
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
    },
    stepsTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151',
        marginTop: '0',
        marginBottom: '12px',
    },
    stepsList: {
        margin: '0',
        paddingLeft: '20px',
        color: '#4b5563',
        fontSize: '14px',
        lineHeight: '1.8',
    },
    stepItem: {},
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
