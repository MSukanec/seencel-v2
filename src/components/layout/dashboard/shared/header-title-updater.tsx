"use client";

import * as React from "react";
import { useLayoutStore } from "@/store/layout-store";

interface HeaderTitleUpdaterProps {
    title: React.ReactNode;
}

/**
 * Component that updates the header title via the layout store.
 * Renders nothing - only used for side effects.
 */
export function HeaderTitleUpdater({ title }: HeaderTitleUpdaterProps) {
    const setHeaderTitle = useLayoutStore((state) => state.actions.setHeaderTitle);

    React.useEffect(() => {
        setHeaderTitle(title);
        return () => {
            setHeaderTitle(null);
        };
    }, [title, setHeaderTitle]);

    return null;
}

