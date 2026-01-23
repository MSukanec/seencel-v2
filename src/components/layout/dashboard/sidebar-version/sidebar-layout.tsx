"use client";

import * as React from "react"
import { Sidebar } from "./sidebar";
import { UserProfile } from "@/types/user";

interface SidebarLayoutProps {
    children: React.ReactNode;
    user?: UserProfile | null;
}

export function SidebarLayout({ children, user }: SidebarLayoutProps) {
    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            <div className="flex flex-1 overflow-hidden relative">
                {/* Desktop Sidebar - Hidden on Mobile */}
                <div className="hidden md:block h-full">
                    <Sidebar user={user} />
                </div>

                <main className="flex-1 overflow-hidden flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    );
}

