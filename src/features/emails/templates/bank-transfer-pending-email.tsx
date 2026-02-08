import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter, EmailCardRow, EmailCardTotal } from '../lib/email-base';

interface BankTransferPendingEmailProps {
    firstName: string;
    productName: string;
    amount: string;
    currency: string;
    reference: string;
}

export function BankTransferPendingEmail({
    firstName,
    productName,
    amount,
    currency,
    reference,
}: Readonly<BankTransferPendingEmailProps>) {
    return (
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>Comprobante Recibido</h1>

                <p style={emailBaseStyles.greeting}>Hola {firstName},</p>

                <p style={emailBaseStyles.text}>
                    Gracias por enviar tu comprobante de transferencia para <strong>{productName}</strong>.
                </p>

                <div style={emailBaseStyles.highlightBox}>
                    <p style={emailBaseStyles.highlightLabel}>
                        ¡Ya tenés acceso!
                    </p>
                    <p style={emailBaseStyles.highlightValue}>
                        Hemos habilitado tu acceso mientras nuestro equipo verifica el pago.
                    </p>
                </div>

                <div style={emailBaseStyles.card}>
                    <h3 style={emailBaseStyles.cardTitle}>Detalles de la Operación</h3>
                    <EmailCardRow label="Producto" value={productName} />
                    <EmailCardRow label="Referencia" value={reference} mono />
                    <EmailCardTotal label="Monto declarado" value={`${currency} ${amount}`} />
                </div>

                <div style={emailBaseStyles.noticeBox}>
                    <p style={emailBaseStyles.noticeText}>
                        <strong>Información importante:</strong><br />
                        La verificación manual puede demorar hasta 24 horas hábiles.
                        Te enviaremos un email de confirmación definitiva cuando el proceso finalice.
                    </p>
                </div>
            </div>

            <EmailFooter />
        </div>
    );
}
