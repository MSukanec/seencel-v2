import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter, EmailCardRow, EmailCardTotal } from '../lib/email-base';
import { type EmailLocale } from '../lib/email-translations';

interface CoursePurchaseConfirmationEmailProps {
    firstName: string;
    courseName: string;
    amount: string;
    currency: string;
    transactionId: string;
    purchaseDate: string;
    locale?: EmailLocale;
}

export function CoursePurchaseConfirmationEmail({
    firstName,
    courseName,
    amount,
    currency,
    transactionId,
    purchaseDate,
    locale = 'es',
}: Readonly<CoursePurchaseConfirmationEmailProps>) {
    const labels: Record<EmailLocale, Record<string, string>> = {
        es: {
            title: '¡Tu curso está listo!',
            greeting: 'Hola',
            intro: 'Tu compra ha sido procesada exitosamente. Ya tenés acceso completo al curso.',
            detailsTitle: 'Detalle de Compra',
            course: 'Curso',
            access: 'Acceso',
            accessValue: '1 año desde la compra',
            date: 'Fecha',
            transactionId: 'ID de Transacción',
            total: 'Total',
            goToCourse: 'Ir a Mi Curso',
            ready: 'Tu curso ya está disponible. Podés empezar a aprender cuando quieras desde tu panel de cursos.',
            questions: 'Si tenés alguna pregunta, no dudes en contactarnos.',
        },
        en: {
            title: 'Your course is ready!',
            greeting: 'Hello',
            intro: 'Your purchase has been processed successfully. You now have full access to the course.',
            detailsTitle: 'Purchase Details',
            course: 'Course',
            access: 'Access',
            accessValue: '1 year from purchase',
            date: 'Date',
            transactionId: 'Transaction ID',
            total: 'Total',
            goToCourse: 'Go to My Course',
            ready: 'Your course is now available. You can start learning whenever you want from your courses dashboard.',
            questions: 'If you have any questions, feel free to contact us.',
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

                    <EmailCardRow label={l.course} value={courseName} />
                    <EmailCardRow label={l.access} value={l.accessValue} />
                    <EmailCardRow label={l.date} value={purchaseDate} />
                    <EmailCardRow label={l.transactionId} value={transactionId} last mono />
                    <EmailCardTotal label={l.total} value={`${currency} ${amount}`} />
                </div>

                <div style={emailBaseStyles.ctaContainer}>
                    <a href="https://seencel.com/academy/my-courses" style={emailBaseStyles.cta}>
                        {l.goToCourse}
                    </a>
                </div>

                <p style={emailBaseStyles.text}>{l.ready}</p>

                <p style={emailBaseStyles.smallText}>{l.questions}</p>
            </div>

            <EmailFooter locale={locale} />
        </div>
    );
}
