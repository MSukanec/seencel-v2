"use client";

import * as React from "react"
import { Sidebar } from "./sidebar";
import { UserProfile } from "@/types/user";
import { RightToolsSidebar } from "@/components/layout/right-tools-sidebar";

export function SidebarLayout({ children, user }: { children: React.ReactNode, user?: UserProfile | null }) {
    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            <div className="flex flex-1 overflow-hidden relative">
                {/* Desktop Sidebar - Hidden on Mobile */}
                <div className="hidden md:block h-full">
                    <Sidebar />
                </div>

                <main className="flex-1 overflow-hidden flex flex-col">
                    {children}
                </main>
                <div className="hidden md:block">
                    <RightToolsSidebar user={user} />
                </div>
            </div>
        </div>
    );
}
