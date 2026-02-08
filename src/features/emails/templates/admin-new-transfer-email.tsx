import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter, EmailCardRow, EmailCardTotal } from '../lib/email-base';

interface AdminNewTransferEmailProps {
    payerName: string;
    payerEmail: string;
    productName: string;
    amount: string;
    currency: string;
    transferId: string;
    receiptUrl: string;
}

export function AdminNewTransferEmail({
    payerName,
    payerEmail,
    productName,
    amount,
    currency,
    transferId,
    receiptUrl,
}: Readonly<AdminNewTransferEmailProps>) {
    return (
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>Nueva Transferencia</h1>

                <p style={emailBaseStyles.text}>
                    Un usuario ha subido un nuevo comprobante de transferencia.
                    Se requiere verificación manual.
                </p>

                <div style={emailBaseStyles.card}>
                    <h3 style={emailBaseStyles.cardTitle}>Datos del Pago</h3>

                    <EmailCardRow label="Usuario" value={payerName} />
                    <EmailCardRow label="Email" value={payerEmail} />
                    <EmailCardRow label="Producto" value={productName} />
                    <EmailCardRow label="ID Transferencia" value={transferId} mono />
                    <EmailCardTotal label="Monto" value={`${currency} ${amount}`} />
                </div>

                <div style={emailBaseStyles.ctaContainer}>
                    <a href="https://seencel.com/es/admin/finance" style={emailBaseStyles.cta}>
                        Revisar en Admin
                    </a>
                </div>

                {receiptUrl && (
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <a href={receiptUrl} style={emailBaseStyles.link}>Ver Comprobante Adjunto</a>
                    </div>
                )}
            </div>

            <EmailFooter />
        </div>
    );
}
