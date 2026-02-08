import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter, EmailCardRow, EmailCardTotal } from '../lib/email-base';
import { t, type EmailLocale } from '../lib/email-translations';

interface PurchaseConfirmationEmailProps {
    firstName: string;
    planName: string;
    billingCycle: 'monthly' | 'annual';
    amount: string;
    currency: string;
    paymentMethod: 'mercadopago' | 'paypal' | 'bank_transfer';
    transactionId: string;
    purchaseDate: string;
    locale?: EmailLocale;
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
    locale = 'es',
}: Readonly<PurchaseConfirmationEmailProps>) {
    const paymentMethodLabels: Record<EmailLocale, Record<string, string>> = {
        es: {
            mercadopago: 'MercadoPago',
            paypal: 'PayPal',
            bank_transfer: 'Transferencia Bancaria',
        },
        en: {
            mercadopago: 'MercadoPago',
            paypal: 'PayPal',
            bank_transfer: 'Bank Transfer',
        },
    };

    const cycleLabels: Record<EmailLocale, Record<string, string>> = {
        es: { monthly: 'Mensual', annual: 'Anual' },
        en: { monthly: 'Monthly', annual: 'Annual' },
    };

    const labels: Record<EmailLocale, Record<string, string>> = {
        es: {
            title: 'Pago Confirmado',
            greeting: 'Hola',
            intro: 'Tu pago ha sido procesado exitosamente. A continuación encontrarás los detalles de tu compra.',
            detailsTitle: 'Detalle de Compra',
            plan: 'Plan',
            cycle: 'Ciclo',
            paymentMethod: 'Método de pago',
            date: 'Fecha',
            transactionId: 'ID de Transacción',
            total: 'Total',
            viewSubscription: 'Ver Mi Suscripción',
            active: 'Tu suscripción ya está activa. Podés empezar a usar todas las funcionalidades de tu plan desde ahora.',
            questions: 'Si tenés alguna pregunta sobre tu compra, no dudes en contactarnos.',
        },
        en: {
            title: 'Payment Confirmed',
            greeting: 'Hello',
            intro: 'Your payment has been processed successfully. Below you will find the details of your purchase.',
            detailsTitle: 'Purchase Details',
            plan: 'Plan',
            cycle: 'Cycle',
            paymentMethod: 'Payment method',
            date: 'Date',
            transactionId: 'Transaction ID',
            total: 'Total',
            viewSubscription: 'View My Subscription',
            active: 'Your subscription is now active. You can start using all the features of your plan right now.',
            questions: 'If you have any questions about your purchase, feel free to contact us.',
        },
    };

    const l = labels[locale];

    return (
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>{l.title}</h1>

                <p style={emailBaseStyles.greeting}>{l.greeting} {firstName},</p>

                <p style={emailBaseStyles.text}>{l.intro}</p>

                <div style={emailBaseStyles.card}>
                    <h3 style={emailBaseStyles.cardTitle}>{l.detailsTitle}</h3>

                    <EmailCardRow label={l.plan} value={planName} />
                    <EmailCardRow label={l.cycle} value={cycleLabels[locale][billingCycle]} />
                    <EmailCardRow label={l.paymentMethod} value={paymentMethodLabels[locale][paymentMethod]} />
                    <EmailCardRow label={l.date} value={purchaseDate} />
                    <EmailCardRow label={l.transactionId} value={transactionId} last mono />
                    <EmailCardTotal label={l.total} value={`${currency} ${amount}`} />
                </div>

                <div style={emailBaseStyles.ctaContainer}>
                    <a href="https://seencel.com/pricing" style={emailBaseStyles.cta}>
                        {l.viewSubscription}
                    </a>
                </div>

                <p style={emailBaseStyles.text}>{l.active}</p>

                <p style={emailBaseStyles.smallText}>{l.questions}</p>
            </div>

            <EmailFooter locale={locale} />
        </div>
    );
}
