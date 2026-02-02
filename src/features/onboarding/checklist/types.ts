// Onboarding Checklist Types
// IMPORTANTE: Estas keys deben coincidir con el default de user_preferences.home_checklist en la DB

export type OnboardingStepKey =
    | 'create_project'
    | 'create_contact'
    | 'create_movement';

export interface OnboardingStep {
    key: OnboardingStepKey;
    title: string;
    description: string;
    href: string;
    icon: string; // Lucide icon name
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        key: 'create_project',
        title: 'Crear tu primer proyecto',
        description: 'Los proyectos organizan tus obras',
        href: '/organization/projects',
        icon: 'Building',
    },
    {
        key: 'create_contact',
        title: 'Agregar un contacto',
        description: 'Proveedores, clientes o empleados',
        href: '/organization/contacts',
        icon: 'Users',
    },
    {
        key: 'create_movement',
        title: 'Registrar un movimiento',
        description: 'Cualquier pago o ingreso',
        href: '/organization/finance',
        icon: 'CreditCard',
    },
];

export type OnboardingChecklist = Record<OnboardingStepKey, boolean>;

export const DEFAULT_ONBOARDING_CHECKLIST: OnboardingChecklist = {
    create_project: false,
    create_contact: false,
    create_movement: false,
};


