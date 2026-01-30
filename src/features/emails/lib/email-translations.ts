/**
 * Email Translations
 * Centralized translations for all email templates
 * Default locale: 'es' (Spanish)
 */

export type EmailLocale = 'es' | 'en';

const translations = {
    // Common
    common: {
        footer: {
            es: 'Todos los derechos reservados.',
            en: 'All rights reserved.',
        },
        privacy: {
            es: 'Privacidad',
            en: 'Privacy',
        },
        terms: {
            es: 'Términos',
            en: 'Terms',
        },
        goToDashboard: {
            es: 'Ir al Dashboard',
            en: 'Go to Dashboard',
        },
        viewDetails: {
            es: 'Ver Detalles',
            en: 'View Details',
        },
    },

    // Welcome Email
    welcome: {
        title: {
            es: 'Bienvenido a SEENCEL',
            en: 'Welcome to SEENCEL',
        },
        greeting: {
            es: 'Hola',
            en: 'Hello',
        },
        body: {
            es: 'Tu cuenta ha sido creada exitosamente. Ahora sos parte de la comunidad de profesionales que están transformando la gestión de sus proyectos de construcción.',
            en: 'Your account has been successfully created. You are now part of the community of professionals who are transforming their construction project management.',
        },
        accountLabel: {
            es: 'Tu cuenta',
            en: 'Your account',
        },
        emailLabel: {
            es: 'Email:',
            en: 'Email:',
        },
        nextSteps: {
            es: 'Ya podés crear tu primera organización, agregar proyectos, invitar a tu equipo y monitorear presupuestos y avances.',
            en: 'You can now create your first organization, add projects, invite your team, and monitor budgets and progress.',
        },
        help: {
            es: 'Si tenés alguna pregunta, respondé a este email o visitá nuestra sección de ayuda.',
            en: 'If you have any questions, reply to this email or visit our help section.',
        },
    },

    // Purchase Confirmation Email
    purchase: {
        title: {
            es: 'Gracias por tu compra',
            en: 'Thank you for your purchase',
        },
        greeting: {
            es: 'Hola',
            en: 'Hello',
        },
        confirmed: {
            es: 'Tu pago ha sido confirmado.',
            en: 'Your payment has been confirmed.',
        },
        orderDetails: {
            es: 'Detalle del pedido',
            en: 'Order Details',
        },
        product: {
            es: 'Producto',
            en: 'Product',
        },
        plan: {
            es: 'Plan',
            en: 'Plan',
        },
        course: {
            es: 'Curso',
            en: 'Course',
        },
        amount: {
            es: 'Monto',
            en: 'Amount',
        },
        paymentId: {
            es: 'ID de Pago',
            en: 'Payment ID',
        },
        accessNow: {
            es: 'Ya podés acceder a todos los beneficios de tu compra.',
            en: 'You can now access all the benefits of your purchase.',
        },
        questions: {
            es: 'Si tenés alguna pregunta sobre tu compra, respondé a este email.',
            en: 'If you have any questions about your purchase, reply to this email.',
        },
    },

    // Admin Sale Notification
    adminSale: {
        title: {
            es: 'Nueva Venta Registrada',
            en: 'New Sale Registered',
        },
        newSale: {
            es: 'Se ha procesado una nueva venta en la plataforma.',
            en: 'A new sale has been processed on the platform.',
        },
        saleDetails: {
            es: 'Detalles de la venta',
            en: 'Sale Details',
        },
        buyer: {
            es: 'Comprador',
            en: 'Buyer',
        },
        product: {
            es: 'Producto',
            en: 'Product',
        },
        amount: {
            es: 'Monto',
            en: 'Amount',
        },
        paymentId: {
            es: 'ID de Pago',
            en: 'Payment ID',
        },
        goToAdmin: {
            es: 'Ir al Panel de Admin',
            en: 'Go to Admin Panel',
        },
    },

    // Bank Transfer Pending
    bankPending: {
        title: {
            es: 'Transferencia Pendiente',
            en: 'Transfer Pending',
        },
        greeting: {
            es: 'Hola',
            en: 'Hello',
        },
        pendingInfo: {
            es: 'Recibimos tu solicitud de pago por transferencia bancaria.',
            en: 'We received your bank transfer payment request.',
        },
        reference: {
            es: 'Referencia de pago',
            en: 'Payment Reference',
        },
        steps: {
            es: 'Realizá la transferencia a la cuenta indicada incluyendo la referencia.',
            en: 'Make the transfer to the indicated account including the reference.',
        },
        orderDetails: {
            es: 'Detalle del pedido',
            en: 'Order Details',
        },
        product: {
            es: 'Producto',
            en: 'Product',
        },
        amount: {
            es: 'Monto',
            en: 'Amount',
        },
        processing: {
            es: 'Una vez verificado el pago, recibirás un email de confirmación.',
            en: 'Once the payment is verified, you will receive a confirmation email.',
        },
    },

    // Bank Transfer Verified
    bankVerified: {
        title: {
            es: 'Transferencia Verificada',
            en: 'Transfer Verified',
        },
        greeting: {
            es: 'Hola',
            en: 'Hello',
        },
        verified: {
            es: 'Tu transferencia bancaria ha sido verificada exitosamente.',
            en: 'Your bank transfer has been successfully verified.',
        },
        orderDetails: {
            es: 'Detalle del pedido',
            en: 'Order Details',
        },
        product: {
            es: 'Producto',
            en: 'Product',
        },
        amount: {
            es: 'Monto',
            en: 'Amount',
        },
        accessNow: {
            es: 'Ya podés acceder a todos los beneficios de tu compra.',
            en: 'You can now access all the benefits of your purchase.',
        },
    },

    // Subscription Activated
    subscriptionActivated: {
        title: {
            es: 'Suscripción Activada',
            en: 'Subscription Activated',
        },
        greeting: {
            es: 'Hola',
            en: 'Hello',
        },
        activated: {
            es: 'Tu suscripción ha sido activada exitosamente.',
            en: 'Your subscription has been successfully activated.',
        },
        subscriptionDetails: {
            es: 'Detalle de suscripción',
            en: 'Subscription Details',
        },
        plan: {
            es: 'Plan',
            en: 'Plan',
        },
        status: {
            es: 'Estado',
            en: 'Status',
        },
        active: {
            es: 'Activo',
            en: 'Active',
        },
        renewalDate: {
            es: 'Próxima renovación',
            en: 'Next renewal',
        },
        enjoy: {
            es: 'Ahora podés disfrutar de todos los beneficios de tu plan.',
            en: 'You can now enjoy all the benefits of your plan.',
        },
    },

    // Subscription Expiring
    subscriptionExpiring: {
        title: {
            es: 'Tu suscripción está por vencer',
            en: 'Your subscription is about to expire',
        },
        greeting: {
            es: 'Hola',
            en: 'Hello',
        },
        expiring: {
            es: 'Tu suscripción vencerá pronto.',
            en: 'Your subscription will expire soon.',
        },
        subscriptionDetails: {
            es: 'Detalle de suscripción',
            en: 'Subscription Details',
        },
        plan: {
            es: 'Plan',
            en: 'Plan',
        },
        expiresOn: {
            es: 'Vence el',
            en: 'Expires on',
        },
        renewNow: {
            es: 'Renovar Ahora',
            en: 'Renew Now',
        },
        dontLose: {
            es: 'No pierdas acceso a las funciones de tu plan.',
            en: "Don't lose access to your plan's features.",
        },
    },

    // Subscription Expired
    subscriptionExpired: {
        title: {
            es: 'Tu suscripción ha vencido',
            en: 'Your subscription has expired',
        },
        greeting: {
            es: 'Hola',
            en: 'Hello',
        },
        expired: {
            es: 'Tu suscripción ha vencido.',
            en: 'Your subscription has expired.',
        },
        subscriptionDetails: {
            es: 'Detalle de suscripción',
            en: 'Subscription Details',
        },
        plan: {
            es: 'Plan',
            en: 'Plan',
        },
        expiredOn: {
            es: 'Venció el',
            en: 'Expired on',
        },
        reactivate: {
            es: 'Reactivar Suscripción',
            en: 'Reactivate Subscription',
        },
        lostAccess: {
            es: 'Has perdido acceso a las funciones premium de tu plan.',
            en: "You've lost access to your plan's premium features.",
        },
    },
} as const;

/**
 * Get translation for a specific key and locale
 */
export function t(
    section: keyof typeof translations,
    key: string,
    locale: EmailLocale = 'es'
): string {
    const sectionData = translations[section] as Record<string, Record<EmailLocale, string>>;
    const keyData = sectionData[key];

    if (!keyData) {
        console.warn(`Email translation missing: ${section}.${key}`);
        return key;
    }

    return keyData[locale] || keyData['es']; // Fallback to Spanish
}

/**
 * Get common footer translations
 */
export function getFooterText(locale: EmailLocale = 'es') {
    return {
        copyright: t('common', 'footer', locale),
        privacy: t('common', 'privacy', locale),
        terms: t('common', 'terms', locale),
    };
}
