"use client";

import { create } from 'zustand';
import React from 'react';

export type ModalType = 'PROJECT_FORM' | 'CONFIRMATION' | 'CUSTOM';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalOptions {
    title?: string;
    description?: string;
    size?: ModalSize;
    key?: string; // For URL synchronization
    morphLayoutId?: string; // For Contextual Morphing (Framer Motion)
}

interface ModalItem extends ModalOptions {
    id: string;
    view: React.ReactNode;
    beforeClose?: () => Promise<boolean> | boolean;
}

interface ModalStore {
    stack: ModalItem[];

    // Actions
    openModal: (view: React.ReactNode, options?: ModalOptions) => void;
    closeModal: () => Promise<void>;
    closeAll: () => void;

    // Helper to update the top modal's beforeClose handler
    setBeforeClose: (handler: (() => Promise<boolean> | boolean) | undefined) => void;
}

export const useModal = create<ModalStore>((set, get) => ({
    stack: [],

    openModal: (view, options) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
            stack: [...state.stack, {
                id,
                view,
                title: options?.title,
                description: options?.description,
                size: options?.size || 'md',
                key: options?.key,
                morphLayoutId: options?.morphLayoutId,
                beforeClose: undefined
            }]
        }));
    },

    closeModal: async () => {
        const { stack } = get();
        if (stack.length === 0) return;

        const topModal = stack[stack.length - 1];

        // Check beforeClose interceptor
        if (topModal.beforeClose) {
            const canClose = await topModal.beforeClose();
            if (!canClose) return;
        }

        set((state) => ({
            stack: state.stack.slice(0, -1)
        }));
    },

    closeAll: () => set({ stack: [] }),

    setBeforeClose: (handler) => {
        set((state) => {
            if (state.stack.length === 0) return state;

            // Create a new stack with the updated last item
            const newStack = [...state.stack];
            const lastIndex = newStack.length - 1;
            newStack[lastIndex] = { ...newStack[lastIndex], beforeClose: handler };

            return { stack: newStack };
        });
    },
}));
