import { create } from "zustand";

// ============================================================================
// DASHBOARD EDIT STORE
// ============================================================================
// Micro-store para comunicar el estado de edición del dashboard
// entre el botón del header y el DashboardWidgetGrid.
// ============================================================================

interface DashboardEditStore {
    isEditing: boolean;
    toggle: () => void;
    setEditing: (editing: boolean) => void;
}

export const useDashboardEditStore = create<DashboardEditStore>((set) => ({
    isEditing: false,
    toggle: () => set((state) => ({ isEditing: !state.isEditing })),
    setEditing: (editing) => set({ isEditing: editing }),
}));
