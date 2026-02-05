/**
 * React Query Keys
 * Standardized key patterns for consistent cache management
 * 
 * Import from here for query keys, import hooks from use-query-patterns.ts
 */
export const queryKeys = {
    // Clients
    clients: (projectId: string) => ['clients', projectId] as const,
    clientPayments: (clientId: string) => ['client-payments', clientId] as const,
    clientCommitments: (clientId: string) => ['client-commitments', clientId] as const,

    // Projects  
    projects: (orgId: string) => ['projects', orgId] as const,
    project: (projectId: string) => ['project', projectId] as const,

    // Contacts
    contacts: (orgId: string) => ['contacts', orgId] as const,

    // Kanban
    kanbanBoard: (boardId: string) => ['kanban-board', boardId] as const,
    kanbanCards: (boardId: string) => ['kanban-cards', boardId] as const,

    // Finance
    financeOverview: (projectId: string) => ['finance-overview', projectId] as const,
    wallets: (orgId: string) => ['wallets', orgId] as const,
    currencies: (orgId: string) => ['currencies', orgId] as const,

    // Academy
    courses: () => ['courses'] as const,
    enrollments: () => ['enrollments'] as const,
    instructors: () => ['instructors'] as const,

    // Notifications
    notifications: (userId: string) => ['notifications', userId] as const,
} as const;
