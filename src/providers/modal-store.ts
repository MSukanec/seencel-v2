"use client";

import { create } from 'zustand';
import React from 'react';

export type ModalType = 'PROJECT_FORM' | 'CONFIRMATION' | 'CUSTOM';

interface ModalStore {
    isOpen: boolean;
    view: React.ReactNode | null;
    title?: string;
    description?: string;
    // We can extend this with specific modal types if we want strict typing for data
    // or keep it agnostic with ReactNode "view" which is flexible.
    // For Enterprise scalability, passing the component directly is often cleanest for "view"
    // avoiding a giant switch statement in the provider.

    openModal: (view: React.ReactNode, options: { title: string; description: string }) => void;
    closeModal: () => void;
}

export const useModal = create<ModalStore>((set) => ({
    isOpen: false,
    view: null,
    title: undefined,
    description: undefined,
    openModal: (view, options) => set({
        isOpen: true,
        view,
        title: options?.title,
        description: options?.description
    }),
    closeModal: () => set({
        isOpen: false,
        view: null,
        title: undefined,
        description: undefined
    }),
}));
