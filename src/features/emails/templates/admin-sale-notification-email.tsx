import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter, EmailCardRow, EmailCardTotal } from '../lib/email-base';

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
                <h1 style={emailBaseStyles.title}>Nueva Venta</h1>

                <p style={emailBaseStyles.text}>
                    Se ha registrado una nueva compra en la plataforma.
                </p>

                <div style={emailBaseStyles.card}>
                    <h3 style={emailBaseStyles.cardTitle}>Detalle de la Venta</h3>

                    <EmailCardRow label="Comprador" value={buyerName} />
                    <EmailCardRow label="Email" value={buyerEmail} />
                    <EmailCardRow label="Tipo" value={productTypeLabels[productType]} />
                    <EmailCardRow label="Producto" value={productName} />
                    <EmailCardRow label="Fecha" value={purchaseDate} />
                    <EmailCardRow label="Payment ID" value={`${paymentId.slice(0, 8)}...`} last mono />
                    <EmailCardTotal label="Total" value={`${currency} ${amount}`} />
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
