import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter, EmailCardRow } from '../lib/email-base';
import { t, type EmailLocale } from '../lib/email-translations';

interface TeamInvitationEmailProps {
    organizationName: string;
    inviterName: string;
    roleName: string;
    acceptUrl: string;
    locale?: EmailLocale;
}

export function TeamInvitationEmail({
    organizationName,
    inviterName,
    roleName,
    acceptUrl,
    locale = 'es'
}: Readonly<TeamInvitationEmailProps>) {
    return (
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>{t('teamInvitation', 'title', locale)}</h1>

                <p style={emailBaseStyles.text}>
                    {t('teamInvitation', 'body', locale).replace('{orgName}', organizationName).replace('{inviterName}', inviterName)}
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
                        {t('teamInvitation', 'expiresNotice', locale)}
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
