"use client";

import * as React from "react"
import { Sidebar } from "./sidebar";
import { UserProfile } from "@/types/user";
import { RightToolsSidebar } from "@/components/layout/right-tools-sidebar";

export function SidebarLayout({ children, user }: { children: React.ReactNode, user?: UserProfile | null }) {
    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar />
                <main className="flex-1 overflow-hidden flex flex-col">
                    {children}
                </main>
                <RightToolsSidebar user={user} />
            </div>
        </div>
    );
}
