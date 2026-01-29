import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter } from '../lib/email-base';

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
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>Pago Confirmado</h1>

                <p style={emailBaseStyles.greeting}>Hola {firstName},</p>

                <p style={emailBaseStyles.text}>
                    Tu pago ha sido procesado exitosamente. A continuación encontrarás
                    los detalles de tu compra.
                </p>

                <div style={emailBaseStyles.card}>
                    <h3 style={emailBaseStyles.cardTitle}>Detalle de Compra</h3>

                    <div style={emailBaseStyles.cardRow}>
                        <span style={emailBaseStyles.cardLabel}>Plan</span>
                        <span style={emailBaseStyles.cardValue}>{planName}</span>
                    </div>

                    <div style={emailBaseStyles.cardRow}>
                        <span style={emailBaseStyles.cardLabel}>Ciclo</span>
                        <span style={emailBaseStyles.cardValue}>{cycleLabels[billingCycle]}</span>
                    </div>

                    <div style={emailBaseStyles.cardRow}>
                        <span style={emailBaseStyles.cardLabel}>Método de pago</span>
                        <span style={emailBaseStyles.cardValue}>{paymentMethodLabels[paymentMethod]}</span>
                    </div>

                    <div style={emailBaseStyles.cardRow}>
                        <span style={emailBaseStyles.cardLabel}>Fecha</span>
                        <span style={emailBaseStyles.cardValue}>{purchaseDate}</span>
                    </div>

                    <div style={emailBaseStyles.cardRowLast}>
                        <span style={emailBaseStyles.cardLabel}>ID de Transacción</span>
                        <span style={emailBaseStyles.cardValueMono}>{transactionId}</span>
                    </div>

                    <div style={emailBaseStyles.cardTotal}>
                        <span style={emailBaseStyles.cardTotalLabel}>Total</span>
                        <span style={emailBaseStyles.cardTotalValue}>{currency} {amount}</span>
                    </div>
                </div>

                <div style={emailBaseStyles.ctaContainer}>
                    <a href="https://seencel.com/organization/billing" style={emailBaseStyles.cta}>
                        Ver Mi Suscripción
                    </a>
                </div>

                <p style={emailBaseStyles.text}>
                    Tu suscripción ya está activa. Podés empezar a usar todas las
                    funcionalidades de tu plan {planName} desde ahora.
                </p>

                <p style={emailBaseStyles.smallText}>
                    Si tenés alguna pregunta sobre tu compra, no dudes en contactarnos.
                </p>
            </div>

            <EmailFooter />
        </div>
    );
}
