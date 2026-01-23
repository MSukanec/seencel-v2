'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useModal } from './modal-store';
import { MODAL_REGISTRY } from './modal-registry';

function ModalUrlSynchronizerContent() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const { stack, openModal, closeModal } = useModal();

    // 1. URL -> Modal Sync (Deep Linking & Back Button)
    useEffect(() => {
        const modalKey = searchParams.get('modal');

        if (modalKey) {
            // Check if modal is already open to prevent loops or duplicates
            const isAlreadyOpen = stack.some(m => m.key === modalKey);

            if (!isAlreadyOpen) {
                const registryItem = MODAL_REGISTRY[modalKey];
                if (registryItem) {
                    // Extract all query params to pass as props
                    const props = Object.fromEntries(searchParams.entries());

                    openModal(<registryItem.component {...props} />, {
                        ...registryItem.defaultOptions,
                        key: modalKey
                    });
                }
            }
        } else {
            // If URL param is gone, but we have a URL-tracked modal open, close it.
            // This handles the Browser Back button.
            const topModal = stack[stack.length - 1];
            if (topModal && topModal.key) {
                closeModal();
            }
        }
    }, [searchParams]); // Depend on searchParams changes

    // 2. Modal -> URL Sync (User interaction)
    useEffect(() => {
        if (stack.length === 0) {
            // Clean URL if it has a modal param
            if (searchParams.has('modal')) {
                const newParams = new URLSearchParams(searchParams.toString());
                newParams.delete('modal');
                // Remove other params linked to modal? ideally yes, but risky.
                // For now just remove 'modal'
                router.replace(`${pathname}?${newParams.toString()}`);
            }
            return;
        }

        const topModal = stack[stack.length - 1];
        if (topModal.key) {
            const currentKey = searchParams.get('modal');
            if (currentKey !== topModal.key) {
                const newParams = new URLSearchParams(searchParams.toString());
                newParams.set('modal', topModal.key);
                router.replace(`${pathname}?${newParams.toString()}`);
            }
        } else {
            // Top modal has no key (e.g. alert dialog). 
            // Should we clear URL? Maybe not, maybe we are "above" the URL modal.
            // If I open "Create Project" (URL synced) -> "Confirm Delete" (No Key).
            // URL should stay "create-project"?
            // Yes, typically overlay modals don't change URL if they are transient.
        }
    }, [stack]); // Depend on stack changes

    return null;
}

export function ModalUrlSynchronizer() {
    return (
        <Suspense fallback={null}>
            <ModalUrlSynchronizerContent />
        </Suspense>
    );
}

