"use client";

import { useEffect, useState } from "react";
import { useLayoutStore } from "@/stores/layout-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight } from "lucide-react";

interface OrganizationTabsWrapperProps {
    defaultValue: string;
    children: React.ReactNode;
}

export function OrganizationTabsWrapper({ defaultValue, children }: OrganizationTabsWrapperProps) {
    const { actions } = useLayoutStore();
    const [activeTab, setActiveTab] = useState(defaultValue);

    // Removed useEffect that updates header title on tab change.
    // Title is now controlled by the page component (HeaderTitleUpdater) to keep context stable.

    return (
        <Tabs defaultValue={defaultValue} className="w-full h-full flex flex-col" onValueChange={setActiveTab}>
            {children}
        </Tabs>
    );
}

