"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function HeaderPortal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const portalRoot = document.getElementById("header-portal-root");
    if (!portalRoot) return null;

    return createPortal(children, portalRoot);
}

