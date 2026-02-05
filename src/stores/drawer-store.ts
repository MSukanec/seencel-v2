"use client";

import { create } from 'zustand';
import React from 'react';

interface DrawerStore {
    isOpen: boolean;
    title: string | null;
    description: string | null;
    children: React.ReactNode | null;
    openDrawer: (options: {
        title?: string;
        description?: string;
        children: React.ReactNode
    }) => void;
    closeDrawer: () => void;
}

export const useDrawer = create<DrawerStore>((set) => ({
    isOpen: false,
    title: null,
    description: null,
    children: null,
    openDrawer: ({ title, description, children }) => set({
        isOpen: true,
        title: title || null,
        description: description || null,
        children
    }),
    closeDrawer: () => set({
        isOpen: false,
        children: null,
        title: null,
        description: null
    }),
}));
