import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter, EmailCardRow } from '../lib/email-base';
import { t, type EmailLocale } from '../lib/email-translations';

interface TeamInvitationEmailProps {
    organizationName: string;
    inviterName: string;
    roleName: string;
    acceptUrl: string;
    locale?: EmailLocale;
    /** When true, uses external invitation copy (30-day expiry, collaboration context) */
    isExternal?: boolean;
}

export function TeamInvitationEmail({
    organizationName,
    inviterName,
    roleName,
    acceptUrl,
    locale = 'es',
    isExternal = false,
}: Readonly<TeamInvitationEmailProps>) {
    // Use external invitation copy when applicable
    const titleText = isExternal
        ? t('externalInvitation', 'title', locale)
        : t('teamInvitation', 'title', locale);
    const bodyText = isExternal
        ? t('externalInvitation', 'body', locale)
            .replace('{orgName}', organizationName)
            .replace('{inviterName}', inviterName)
            .replace('{roleName}', roleName)
        : t('teamInvitation', 'body', locale)
            .replace('{orgName}', organizationName)
            .replace('{inviterName}', inviterName);
    const expiresText = isExternal
        ? t('externalInvitation', 'expiresNotice', locale)
        : t('teamInvitation', 'expiresNotice', locale);
    return (
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>{titleText}</h1>

                <p style={emailBaseStyles.text}>
                    {bodyText}
                </p>

                <div style={emailBaseStyles.card}>
                    <h3 style={emailBaseStyles.cardTitle}>{t('teamInvitation', 'detailsLabel', locale)}</h3>
                    <EmailCardRow label={t('teamInvitation', 'organizationLabel', locale)} value={organizationName} />
                    <EmailCardRow label={t('teamInvitation', 'roleLabel', locale)} value={roleName} />
                    <EmailCardRow label={t('teamInvitation', 'invitedByLabel', locale)} value={inviterName} last />
                </div>

                <div style={emailBaseStyles.ctaContainer}>
                    <a href={acceptUrl} style={emailBaseStyles.cta}>
                        {t('teamInvitation', 'acceptButton', locale)}
                    </a>
                </div>

                <div style={emailBaseStyles.noticeBox}>
                    <p style={emailBaseStyles.noticeText}>
                        {expiresText}
                    </p>
                </div>

                <p style={emailBaseStyles.smallText}>
                    {t('teamInvitation', 'ignoreNotice', locale)}
                </p>
            </div>

            <EmailFooter locale={locale} />
        </div>
    );
}
