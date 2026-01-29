"use client";

/**
 * Hook to capture and retrieve UTM acquisition parameters
 * Stores them in sessionStorage so they persist across navigation
 * but not across sessions (refresh clears them intentionally for accurate tracking)
 */

const STORAGE_KEY = 'seencel_acquisition';

export interface AcquisitionParams {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_content: string | null;
    landing_page: string | null;
    referrer: string | null;
}

/**
 * Captures UTM params from current URL and stores them
 * Should be called once on initial page load (landing page)
 */
export function captureAcquisitionParams(): void {
    if (typeof window === 'undefined') return;

    // Only capture if not already captured in this session
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing) return;

    const urlParams = new URLSearchParams(window.location.search);

    const params: AcquisitionParams = {
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_content: urlParams.get('utm_content'),
        landing_page: window.location.pathname,
        referrer: document.referrer || null,
    };

    // Only store if at least utm_source exists (real campaign) OR we have a referrer
    if (params.utm_source || params.referrer) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    }
}

/**
 * Retrieves stored acquisition params
 * Returns null values if nothing was captured
 */
export function getAcquisitionParams(): AcquisitionParams {
    if (typeof window === 'undefined') {
        return {
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_content: null,
            landing_page: null,
            referrer: null,
        };
    }

    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return {
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_content: null,
            landing_page: null,
            referrer: null,
        };
    }

    try {
        return JSON.parse(stored) as AcquisitionParams;
    } catch {
        return {
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_content: null,
            landing_page: null,
            referrer: null,
        };
    }
}

/**
 * Clears stored acquisition params (call after successful registration)
 */
export function clearAcquisitionParams(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(STORAGE_KEY);
}
