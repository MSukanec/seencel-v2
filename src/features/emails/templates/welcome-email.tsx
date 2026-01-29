import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter } from '../lib/email-base';

interface WelcomeEmailProps {
    firstName: string;
    email: string;
}

export function WelcomeEmail({ firstName, email }: Readonly<WelcomeEmailProps>) {
    return (
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>Bienvenido a SEENCEL</h1>

                <p style={emailBaseStyles.greeting}>Hola {firstName},</p>

                <p style={emailBaseStyles.text}>
                    Tu cuenta ha sido creada exitosamente. Ahora sos parte de la comunidad
                    de profesionales que están transformando la gestión de sus proyectos
                    de construcción.
                </p>

                <div style={emailBaseStyles.card}>
                    <h3 style={emailBaseStyles.cardTitle}>Tu cuenta</h3>
                    <div style={emailBaseStyles.cardRowLast}>
                        <span style={emailBaseStyles.cardLabel}>Email:</span>
                        <span style={emailBaseStyles.cardValue}>{email}</span>
                    </div>
                </div>

                <p style={emailBaseStyles.text}>
                    Ya podés crear tu primera organización, agregar proyectos, invitar
                    a tu equipo y monitorear presupuestos y avances.
                </p>

                <div style={emailBaseStyles.ctaContainer}>
                    <a href="https://seencel.com/hub" style={emailBaseStyles.cta}>
                        Ir al Dashboard
                    </a>
                </div>

                <p style={emailBaseStyles.smallText}>
                    Si tenés alguna pregunta, respondé a este email o visitá nuestra
                    sección de ayuda.
                </p>
            </div>

            <EmailFooter />
        </div>
    );
}
