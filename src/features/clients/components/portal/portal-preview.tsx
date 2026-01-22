"use client";

import { cn } from "@/lib/utils";
import { PortalShell, PortalSettings } from "./portal-shell";
import { PortalBranding } from "./client-portal-config";

interface PortalPreviewProps {
    settings: Partial<PortalSettings>;
    viewMode: 'mobile' | 'desktop';
    branding?: Partial<PortalBranding>;
}

// Mock data for preview
const mockProject = {
    id: "mock",
    name: "Proyecto Alpha",
    color: "#83cc16",
    image_url: null as string | null,
};

const mockClient = {
    id: "mock-client",
    contact_full_name: "Juan Pérez",
    contact_avatar_url: null as string | null,
};

const mockData = {
    payments: [
        { id: "1", payment_date: "10 Ene 2026", amount: 10000, status: "confirmed" },
        { id: "2", payment_date: "15 Dic 2025", amount: 8000, status: "confirmed" },
        { id: "3", payment_date: "01 Dic 2025", amount: 5000, status: "confirmed" },
    ],
    schedules: [
        { id: "1", due_date: "01 Dic 2025", amount: 5000, status: "paid" },
        { id: "2", due_date: "15 Dic 2025", amount: 8000, status: "paid" },
        { id: "3", due_date: "15 Feb 2026", amount: 5000, status: "pending" },
        { id: "4", due_date: "15 Mar 2026", amount: 7000, status: "future" },
    ],
    summary: {
        total_committed_amount: 25000,
        total_paid_amount: 18000,
        balance_due: 7000,
        currency_symbol: "$"
    },
    logs: []
};

export function PortalPreview({ settings, viewMode, branding }: PortalPreviewProps) {
    const isMobile = viewMode === 'mobile';

    // Merge with defaults
    const fullSettings: PortalSettings = {
        show_dashboard: true,
        show_installments: false,
        show_payments: false,
        show_logs: false,
        show_amounts: true,
        show_progress: true,
        show_quotes: false,
        allow_comments: false,
        ...settings
    };

    // Apply branding to mock project
    const previewProject = {
        ...mockProject,
        name: branding?.portal_name || mockProject.name,
        color: branding?.primary_color || mockProject.color,
    };

    return (
        <div
            className={cn(
                "rounded-xl shadow-2xl border border-zinc-800 overflow-auto",
                isMobile ? "w-[320px] h-[640px]" : "w-[960px] h-[540px]"
            )}
            style={{
                pointerEvents: 'auto',
            }}
        >
            <PortalShell
                mode="preview"
                project={previewProject}
                client={mockClient}
                settings={fullSettings}
                data={mockData}
                branding={branding}
                isMobile={isMobile}
                className={cn(
                    isMobile ? "min-h-full" : "min-h-full",
                    isMobile && "[&>aside]:hidden"
                )}
            />
        </div>
    );
}
