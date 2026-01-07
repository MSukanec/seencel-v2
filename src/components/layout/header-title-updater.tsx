"use client";

import { useEffect } from "react";
import { useLayoutStore } from "@/store/layout-store";

interface HeaderTitleUpdaterProps {
    title: React.ReactNode;
}

export function HeaderTitleUpdater({ title }: HeaderTitleUpdaterProps) {
    const { actions } = useLayoutStore();

    useEffect(() => {
        actions.setHeaderTitle(title);
        // Optional: clear on unmount, but usually next page overwrites it
        // return () => actions.setHeaderTitle(null); 
    }, [title, actions]);

    return null;
}
