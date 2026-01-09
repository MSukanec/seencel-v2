"use client";

import { create } from 'zustand';
import React from 'react';

export type ModalType = 'PROJECT_FORM' | 'CONFIRMATION' | 'CUSTOM';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalStore {
    isOpen: boolean;
    view: React.ReactNode | null;
    title?: string;
    description?: string;
    size?: ModalSize;
    beforeClose?: () => Promise<boolean> | boolean;

    openModal: (view: React.ReactNode, options: { title: string; description: string; size?: ModalSize }) => void;
    closeModal: () => Promise<void>;
    setBeforeClose: (handler: (() => Promise<boolean> | boolean) | undefined) => void;
}

export const useModal = create<ModalStore>((set, get) => ({
    isOpen: false,
    view: null,
    title: undefined,
    description: undefined,
    size: 'md',
    beforeClose: undefined,

    openModal: (view, options) => set({
        isOpen: true,
        view,
        title: options?.title,
        description: options?.description,
        size: options?.size || 'md',
        beforeClose: undefined
    }),
    closeModal: async () => {
        const { beforeClose } = get();
        if (beforeClose) {
            const canClose = await beforeClose();
            if (!canClose) return;
        }

        set({
            isOpen: false,
            view: null,
            title: undefined,
            description: undefined,
            size: 'md',
            beforeClose: undefined
        });
    },
    setBeforeClose: (handler) => set({ beforeClose: handler }),
}));
