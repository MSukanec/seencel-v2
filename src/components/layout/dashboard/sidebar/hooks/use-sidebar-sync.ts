"use client";

import * as React from "react";
import { usePathname } from "@/i18n/routing";
import { usePendingPathname, useLayoutStore } from "@/stores/layout-store";

/**
 * Encapsulates the logic that reads the current pathname
 * and dispatches actions to the global layout store to sync it.
 */
export function useSidebarSync() {
    const pathname = usePathname();
    const pendingPathname = usePendingPathname();
    const effectivePathname = pendingPathname ?? pathname;
    const { actions } = useLayoutStore();

    // 1. Sync Context based on URL (Navigation) — ALWAYS MOUNTED
    React.useEffect(() => {
        if (effectivePathname.includes('/project/')) { actions.setActiveContext('organization'); return; }
        if (effectivePathname.startsWith('/admin')) { actions.setActiveContext('admin'); return; }
        if (effectivePathname.startsWith('/academy')) { actions.setActiveContext('learnings'); return; }
        if (effectivePathname.startsWith('/founders')) { actions.setActiveContext('organization'); return; }
        if (effectivePathname.startsWith('/discover')) { actions.setActiveContext('discover'); return; }
        if (effectivePathname.startsWith('/settings')) { actions.setActiveContext('settings'); return; }
        if (effectivePathname.startsWith('/organization')) { actions.setActiveContext('organization'); return; }
        if (effectivePathname === '/hub' || effectivePathname === '/') { actions.setActiveContext('home'); return; }
    }, [effectivePathname, actions]);

    // 2. Sync Workspace Section based on URL
    React.useEffect(() => {
        if (!effectivePathname.startsWith('/organization') && !effectivePathname.startsWith('/founders')) return;
        if (effectivePathname.includes('/project/')) return;

        if (effectivePathname.startsWith('/founders')) {
            actions.setActiveWorkspaceSection('founders');
            return;
        }

        if (effectivePathname.startsWith('/organization/catalog')) {
            actions.setActiveWorkspaceSection('catalog');
            return;
        }

        const constructionPaths = ['/construction-tasks', '/sitelog', '/materials', '/labor', '/subcontracts', '/health'];
        if (constructionPaths.some(p => effectivePathname.includes(p))) {
            actions.setActiveWorkspaceSection('construction');
            return;
        }

        const financePaths = ['/finance', '/general-costs', '/quotes', '/clients'];
        if (financePaths.some(p => effectivePathname.includes(p))) {
            actions.setActiveWorkspaceSection('finance');
            return;
        }

        actions.setActiveWorkspaceSection('overview');
    }, [effectivePathname, actions]);

    return { effectivePathname };
}
