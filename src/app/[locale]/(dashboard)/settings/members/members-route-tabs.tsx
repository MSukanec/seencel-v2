"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { Users, Shield } from "lucide-react";
import { createPortal } from "react-dom";
import { PageHeaderTabs } from "@/components/layout/dashboard/header/page-header-tabs";
import { useEffect, useState } from "react";

export function MembersRouteTabs() {
    const pathname = usePathname();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const tabs = [
        { value: "members", label: "Miembros", href: "/settings/members", icon: <Users className="w-4 h-4" /> },
        { value: "permissions", label: "Roles y Permisos", href: "/settings/members/permissions", icon: <Shield className="w-4 h-4" /> }
    ];

    if (!mounted) return null;
    const portalRoot = document.getElementById("page-header-tabs");
    if (!portalRoot) return null;

    // We recreate the notch design from PageWrapper
    return createPortal(
        <div 
            className="flex items-start relative z-10"
            style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.3)) drop-shadow(0px 1px 1px rgba(0,0,0,0.2))" }}
        >
            <div 
                className="w-3 h-3 relative"
                style={{ background: 'radial-gradient(circle at 0% 100%, transparent 11.5px, var(--shell) 12px)' }}
            />
            <div className="bg-shell px-2 pb-1.5 pt-1 rounded-b-xl flex items-center justify-center -mx-[0.5px]">
                <PageHeaderTabs>
                    <div role="tablist">
                        {tabs.map(tab => {
                            // Exact match for members root, starts-with for sub-routes
                            const isActive = tab.href === "/settings/members" 
                                ? pathname === "/settings/members"
                                : pathname.startsWith(tab.href);
                                
                            return (
                                <button
                                    key={tab.value}
                                    role="tab"
                                    data-state={isActive ? "active" : "inactive"}
                                    onClick={() => router.push(tab.href as any)}
                                    className="gap-1.5"
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </PageHeaderTabs>
            </div>
            <div 
                className="w-3 h-3 relative"
                style={{ background: 'radial-gradient(circle at 100% 100%, transparent 11.5px, var(--shell) 12px)' }}
            />
        </div>,
        portalRoot
    );
}
