import type { PortalSettings, PortalData } from './portal-shell';

// ============================================
// DEFAULT BRANDING
// ============================================
export const DEFAULT_BRANDING = {
    portal_name: null as string | null,
    welcome_message: 'Bienvenido a tu portal',
    primary_color: '#83cc16',
    background_color: '#09090b',
    show_hero: true,
    show_footer: true,
    footer_text: null as string | null,
    show_powered_by: true,
};

export type PortalBranding = typeof DEFAULT_BRANDING;

// ============================================
// DEFAULT SETTINGS
// ============================================
export const DEFAULT_SETTINGS: PortalSettings = {
    show_dashboard: true,
    show_installments: false,
    show_payments: false,
    show_logs: false,
    show_amounts: true,
    show_progress: true,
    show_quotes: false,
    allow_comments: false,
};

// ============================================
// HELPER: Prepare portal props from raw data
// ============================================
interface RawPortalData {
    project: any;
    client: any;
    settings: Partial<PortalSettings> | null;
    branding: Partial<PortalBranding> | null;
    payments: any[];
    schedules: any[];
    summary: any;
    logs: any[];
    quotes?: any[];
}

export function preparePortalProps(rawData: RawPortalData) {
    const settings: PortalSettings = rawData.settings
        ? { ...DEFAULT_SETTINGS, ...rawData.settings }
        : DEFAULT_SETTINGS;

    const branding = rawData.branding
        ? { ...DEFAULT_BRANDING, ...rawData.branding }
        : DEFAULT_BRANDING;

    const data: PortalData = {
        payments: rawData.payments || [],
        schedules: rawData.schedules || [],
        summary: rawData.summary,
        logs: rawData.logs || [],
        quotes: rawData.quotes || [],
    };

    return { settings, branding, data };
}

