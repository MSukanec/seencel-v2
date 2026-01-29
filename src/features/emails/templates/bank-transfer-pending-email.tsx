import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter } from '../lib/email-base';

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
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>Instrucciones de Transferencia</h1>

                <p style={emailBaseStyles.greeting}>Hola {firstName},</p>

                <p style={emailBaseStyles.text}>
                    Has elegido pagar tu suscripción <strong>{planName}</strong> mediante
                    transferencia bancaria. A continuación te dejamos los datos para
                    realizar el pago.
                </p>

                <div style={emailBaseStyles.card}>
                    <h3 style={emailBaseStyles.cardTitle}>Datos Bancarios</h3>

                    <div style={emailBaseStyles.cardRow}>
                        <span style={emailBaseStyles.cardLabel}>Banco</span>
                        <span style={emailBaseStyles.cardValue}>{bankName}</span>
                    </div>

                    <div style={emailBaseStyles.cardRow}>
                        <span style={emailBaseStyles.cardLabel}>Titular</span>
                        <span style={emailBaseStyles.cardValue}>{accountHolder}</span>
                    </div>

                    <div style={emailBaseStyles.cardRowLast}>
                        <span style={emailBaseStyles.cardLabel}>CBU / Cuenta</span>
                        <span style={emailBaseStyles.cardValueMono}>{accountNumber}</span>
                    </div>

                    <div style={emailBaseStyles.cardTotal}>
                        <span style={emailBaseStyles.cardTotalLabel}>Monto a transferir</span>
                        <span style={emailBaseStyles.cardTotalValue}>{currency} {amount}</span>
                    </div>
                </div>

                <div style={emailBaseStyles.highlightBox}>
                    <p style={emailBaseStyles.highlightLabel}>
                        Referencia obligatoria (incluir en descripción)
                    </p>
                    <p style={emailBaseStyles.highlightValue}>{reference}</p>
                </div>

                <div style={emailBaseStyles.noticeBox}>
                    <p style={emailBaseStyles.noticeText}>
                        <strong>Importante:</strong> Esta solicitud vence el{' '}
                        <strong>{expiresAt}</strong>. Después de esa fecha, deberás
                        generar una nueva orden de pago.
                    </p>
                </div>

                <p style={emailBaseStyles.text}>
                    <strong>Próximos pasos:</strong>
                </p>
                <ol style={emailBaseStyles.stepsList}>
                    <li>Realizá la transferencia con los datos indicados</li>
                    <li>Incluí el código de referencia en el concepto</li>
                    <li>Te enviaremos un email cuando verifiquemos el pago</li>
                    <li>Tu suscripción se activará automáticamente</li>
                </ol>

                <p style={emailBaseStyles.smallText}>
                    La verificación puede demorar entre 24 y 48 horas hábiles.
                    Si tenés dudas, respondé a este email.
                </p>
            </div>

            <EmailFooter />
        </div>
    );
}
