import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter } from '../lib/email-base';

interface AdminSaleNotificationEmailProps {
    buyerName: string;
    buyerEmail: string;
    productType: 'subscription' | 'course';
    productName: string;
    amount: string;
    currency: string;
    paymentId: string;
    purchaseDate: string;
}

export function AdminSaleNotificationEmail({
    buyerName,
    buyerEmail,
    productType,
    productName,
    amount,
    currency,
    paymentId,
    purchaseDate,
}: Readonly<AdminSaleNotificationEmailProps>) {
    const productTypeLabels = {
        subscription: 'Suscripción',
        course: 'Curso',
    };

    return (
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>💰 Nueva Venta</h1>

                <p style={emailBaseStyles.text}>
                    Se ha registrado una nueva compra en la plataforma.
                </p>

                <div style={emailBaseStyles.card}>
                    <h3 style={emailBaseStyles.cardTitle}>Detalle de la Venta</h3>

                    <div style={emailBaseStyles.cardRow}>
                        <span style={emailBaseStyles.cardLabel}>Comprador</span>
                        <span style={emailBaseStyles.cardValue}>{buyerName}</span>
                    </div>

                    <div style={emailBaseStyles.cardRow}>
                        <span style={emailBaseStyles.cardLabel}>Email</span>
                        <span style={emailBaseStyles.cardValue}>{buyerEmail}</span>
                    </div>

                    <div style={emailBaseStyles.cardRow}>
                        <span style={emailBaseStyles.cardLabel}>Tipo</span>
                        <span style={emailBaseStyles.cardValue}>{productTypeLabels[productType]}</span>
                    </div>

                    <div style={emailBaseStyles.cardRow}>
                        <span style={emailBaseStyles.cardLabel}>Producto</span>
                        <span style={emailBaseStyles.cardValue}>{productName}</span>
                    </div>

                    <div style={emailBaseStyles.cardRow}>
                        <span style={emailBaseStyles.cardLabel}>Fecha</span>
                        <span style={emailBaseStyles.cardValue}>{purchaseDate}</span>
                    </div>

                    <div style={emailBaseStyles.cardRowLast}>
                        <span style={emailBaseStyles.cardLabel}>Payment ID</span>
                        <span style={emailBaseStyles.cardValueMono}>{paymentId.slice(0, 8)}...</span>
                    </div>

                    <div style={emailBaseStyles.cardTotal}>
                        <span style={emailBaseStyles.cardTotalLabel}>Total</span>
                        <span style={emailBaseStyles.cardTotalValue}>{currency} {amount}</span>
                    </div>
                </div>

                <div style={emailBaseStyles.ctaContainer}>
                    <a href="https://seencel.com/admin/soporte" style={emailBaseStyles.cta}>
                        Ver en Admin
                    </a>
                </div>
            </div>

            <EmailFooter />
        </div>
    );
}
