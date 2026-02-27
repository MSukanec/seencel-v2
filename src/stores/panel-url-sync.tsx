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

    // Guards to prevent infinite sync loops between URL and store
    const isSyncingToUrl = useRef(false);
    const isSyncingFromUrl = useRef(false);
    const lastPanelFromUrl = useRef<string | null>(null);

    // 1. URL → Panel Sync (Deep Linking & Back Button)
    useEffect(() => {
        // Skip if we're the one who just updated the URL
        if (isSyncingToUrl.current) {
            isSyncingToUrl.current = false;
            return;
        }

        const panelKey = searchParams.get('panel');

        if (panelKey) {
            // Check if this panel is already open (use fresh store state)
            const currentStack = usePanel.getState().stack;
            const isAlreadyOpen = currentStack.some(p => p.panelId === panelKey);

            if (!isAlreadyOpen) {
                const registryItem = PANEL_REGISTRY[panelKey];
                if (registryItem) {
                    isSyncingFromUrl.current = true;
                    lastPanelFromUrl.current = panelKey;

                    // Extract props from URL params
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
            // URL panel param was removed (e.g., browser Back button)
            // Only close if there IS a panel open AND it wasn't us who removed the param
            const currentStack = usePanel.getState().stack;
            if (currentStack.length > 0 && !isSyncingToUrl.current) {
                isSyncingFromUrl.current = true;
                closePanel();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // 2. Panel → URL Sync (User opens/closes panel programmatically)
    useEffect(() => {
        // Skip if this stack change was triggered by URL sync
        if (isSyncingFromUrl.current) {
            isSyncingFromUrl.current = false;
            return;
        }

        if (stack.length === 0) {
            // Panel closed — clean URL if it has a panel param
            if (searchParams.has('panel')) {
                isSyncingToUrl.current = true;
                const newParams = new URLSearchParams(searchParams.toString());
                newParams.delete('panel');
                newParams.delete('panelId');
                const paramString = newParams.toString();
                router.replace(paramString ? `${pathname}?${paramString}` : pathname);
            }
            return;
        }

        const topPanel = stack[stack.length - 1];
        const currentPanelKey = searchParams.get('panel');

        if (currentPanelKey !== topPanel.panelId) {
            isSyncingToUrl.current = true;
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
