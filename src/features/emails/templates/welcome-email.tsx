import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter } from '../lib/email-base';
import { t, type EmailLocale } from '../lib/email-translations';

interface WelcomeEmailProps {
    firstName: string;
    email: string;
    locale?: EmailLocale;
}

export function WelcomeEmail({ firstName, email, locale = 'es' }: Readonly<WelcomeEmailProps>) {
    return (
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>{t('welcome', 'title', locale)}</h1>

                <p style={emailBaseStyles.greeting}>{t('welcome', 'greeting', locale)} {firstName},</p>

                <p style={emailBaseStyles.text}>
                    {t('welcome', 'body', locale)}
                </p>

                <div style={emailBaseStyles.card}>
                    <h3 style={emailBaseStyles.cardTitle}>{t('welcome', 'accountLabel', locale)}</h3>
                    <div style={emailBaseStyles.cardRowLast}>
                        <span style={emailBaseStyles.cardLabel}>{t('welcome', 'emailLabel', locale)}</span>
                        <span style={emailBaseStyles.cardValue}>{email}</span>
                    </div>
                </div>

                <p style={emailBaseStyles.text}>
                    {t('welcome', 'nextSteps', locale)}
                </p>

                <div style={emailBaseStyles.ctaContainer}>
                    <a href="https://seencel.com/hub" style={emailBaseStyles.cta}>
                        {t('common', 'goToDashboard', locale)}
                    </a>
                </div>

                <p style={emailBaseStyles.smallText}>
                    {t('welcome', 'help', locale)}
                </p>
            </div>

            <EmailFooter locale={locale} />
        </div>
    );
}
