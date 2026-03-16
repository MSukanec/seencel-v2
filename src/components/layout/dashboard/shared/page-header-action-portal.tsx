"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * PageHeaderActionPortal
 * 
 * Renders children into the top page header's action area (#page-header-actions),
 * next to CurrencyModeSelector and DocsButton.
 * 
 * Usage from any client view:
 *   <PageHeaderActionPortal>
 *     <Button onClick={handleCreate}>
 *       <Plus className="h-4 w-4 mr-1" /> Nuevo
 *     </Button>
 *   </PageHeaderActionPortal>
 */
export function PageHeaderActionPortal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const portalRoot = document.getElementById("page-header-actions");
    if (!portalRoot) return null;

    return createPortal(children, portalRoot);
}
