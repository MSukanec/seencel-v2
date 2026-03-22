"use client";

import { ImpersonationBanner } from "./impersonation-banner";
import { ViewingAsBanner } from "./viewing-as-banner";

/**
 * BannerStack Orchestrator
 * 
 * Enforces strict Z-Index priority and execution order for all active global banners.
 * Driven entirely by Flexbox `shrink-0` to guarantee downward push without
 * triggering application double-scrolling constraints.
 */
export function BannerStack() {
    return (
        <div className="flex flex-col w-full z-[100] shrink-0 empty:hidden">
            {/* 1. Critical System Status (Highest Priority) */}
            {/* <MaintenanceBanner /> */}

            {/* 2. Security & Support Context */}
            <ImpersonationBanner />

            {/* 3. Local Organization Context */}
            <ViewingAsBanner />

            {/* 4. Promotional / Informational (Dismissible) */}
            {/* <AnnouncementBanner /> */}
        </div>
    );
}
