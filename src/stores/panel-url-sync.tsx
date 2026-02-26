'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { usePanel } from '@/stores/panel-store';
import { PANEL_REGISTRY } from './panel-registry';
import React from 'react';

function PanelUrlSynchronizerContent() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const { stack, openPanel, closePanel } = usePanel();

    // Guard: prevents URL→Panel sync from reopening a panel that's being closed
    const closingRef = useRef(false);

    // 1. URL → Panel Sync (Deep Linking & Back Button)
    useEffect(() => {
        const panelKey = searchParams.get('panel');

        if (panelKey) {
            if (closingRef.current) return;

            // Check if this panel is already open
            const isAlreadyOpen = stack.some(p => p.panelId === panelKey);

            if (!isAlreadyOpen) {
                const registryItem = PANEL_REGISTRY[panelKey];
                if (registryItem) {
                    // Extract panelId from URL and build props
                    const props: Record<string, unknown> = {};
                    searchParams.forEach((value, key) => {
                        if (key !== 'panel') {
                            props[key] = value;
                        }
                    });

                    openPanel(panelKey, {
                        ...(Object.keys(props).length > 0 ? props : undefined),
                        ...registryItem.defaultOptions,
                    });
                }
            }
        } else {
            // URL was cleaned, reset the closing guard
            closingRef.current = false;

            // If URL param is gone but we have a URL-tracked panel open, close it (browser Back)
            if (stack.length > 0) {
                closePanel();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // 2. Panel → URL Sync (User opens/closes panel programmatically)
    useEffect(() => {
        if (stack.length === 0) {
            // Clean URL if it has a panel param
            if (searchParams.has('panel')) {
                closingRef.current = true;
                const newParams = new URLSearchParams(searchParams.toString());
                newParams.delete('panel');
                // Also clean panelId if present
                newParams.delete('panelId');
                const paramString = newParams.toString();
                router.replace(paramString ? `${pathname}?${paramString}` : pathname);
            }
            return;
        }

        const topPanel = stack[stack.length - 1];
        const currentPanelKey = searchParams.get('panel');

        if (currentPanelKey !== topPanel.panelId) {
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.set('panel', topPanel.panelId);

            // Sync panel props that are serializable (like id)
            if (topPanel.props?.id) {
                newParams.set('panelId', String(topPanel.props.id));
            } else {
                newParams.delete('panelId');
            }

            router.replace(`${pathname}?${newParams.toString()}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stack]);

    return null;
}

export function PanelUrlSynchronizer() {
    return (
        <Suspense fallback={null}>
            <PanelUrlSynchronizerContent />
        </Suspense>
    );
}
