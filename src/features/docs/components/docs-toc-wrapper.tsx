"use client";

import { ContextSidebar } from "@/stores/sidebar-store";
import { DocsTOC } from "./docs-toc";
import type { DocHeading } from "../types";

interface DocsTOCWrapperProps {
    headings: DocHeading[];
}

/**
 * Wrapper that injects DocsTOC into the layout's right sidebar slot
 * using the ContextSidebar pattern.
 */
export function DocsTOCWrapper({ headings }: DocsTOCWrapperProps) {
    return (
        <ContextSidebar title="En esta página">
            <DocsTOC headings={headings} />
        </ContextSidebar>
    );
}
