// Onboarding Checklist Types

export type OnboardingStepKey =
    | 'create_project'
    | 'add_contact'
    | 'register_payment'
    | 'explore_kanban';

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
        key: 'add_contact',
        title: 'Agregar un contacto',
        description: 'Proveedores, clientes o empleados',
        href: '/organization/contacts',
        icon: 'Users',
    },
    {
        key: 'register_payment',
        title: 'Registrar un movimiento',
        description: 'Cualquier pago o ingreso',
        href: '/organization/finance',
        icon: 'CreditCard',
    },
    {
        key: 'explore_kanban',
        title: 'Explorar el Planner',
        description: 'Tu tablero de tareas visual',
        href: '/organization/planner',
        icon: 'LayoutDashboard',
    },
];

export type OnboardingChecklist = Record<OnboardingStepKey, boolean>;

export const DEFAULT_ONBOARDING_CHECKLIST: OnboardingChecklist = {
    create_project: false,
    add_contact: false,
    register_payment: false,
    explore_kanban: false,
};

