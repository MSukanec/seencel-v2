import type { WidgetDefinition, WidgetLayoutItem } from "@/components/widgets/grid/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ============================================================================
// Finance Widgets (Domain-Specific)
// ============================================================================
import { IncomeKpiWidget } from "@/components/widgets/finance/income-kpi-widget";
import { ExpenseKpiWidget } from "@/components/widgets/finance/expense-kpi-widget";
import { BalanceKpiWidget } from "@/components/widgets/finance/balance-kpi-widget";
import { BalanceSummaryWidget } from "@/components/widgets/finance/balance-summary-widget";
import { FinancialEvolutionWidget } from "@/components/widgets/finance/financial-evolution-widget";
import { FinancialSummaryWidget } from "@/components/widgets/finance/financial-summary-widget";
import { WalletDistributionWidget } from "@/components/widgets/finance/wallet-distribution-widget";
import { RecentTransactionsWidget } from "@/components/widgets/finance/recent-transactions-widget";
import { QuickActionsWidget } from "@/components/widgets/finance/quick-actions-widget";
import { CurrencyExchangeWidget } from "@/components/widgets/finance/currency-exchange-widget";

// ============================================================================
// General Widgets (Parametric — Configurable per dashboard)
// ============================================================================
import { ActivityWidget } from "@/components/widgets/general/activity-widget";
import { UpcomingEventsWidget } from "@/components/widgets/general/upcoming-events-widget";
import { FinancialOverviewWidget } from "@/components/widgets/general/financial-summary-widget";
import { TeamMembersWidget } from "@/components/widgets/general/team-members-widget";

// ============================================================================
// Organization Widgets (Org-specific)
// ============================================================================
import { RecentProjectsWidget } from "@/components/widgets/organization/recent-projects-widget";
import { OrgPulseWidget } from "@/components/widgets/organization/org-pulse-widget";

// ============================================================================
// GLOBAL WIDGET REGISTRY
// ============================================================================

/** Display labels for widget groups (folders) */
export const WIDGET_GROUP_LABELS: Record<string, string> = {
    general: 'General',
    organization: 'Organización',
    finance: 'Finanzas',
    planner: 'Planificador',
    projects: 'Proyectos',
    team: 'Equipo',
    sitelog: 'Bitácora de Obra',
};

/** Groups that should appear first in the widget selector */
const GROUP_PRIORITY = ['general'];

/** Sort groups: priority first, then alphabetical by label */
export function getSortedGroups(groups: string[]): string[] {
    return [...groups].sort((a, b) => {
        const aPriority = GROUP_PRIORITY.indexOf(a);
        const bPriority = GROUP_PRIORITY.indexOf(b);
        if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
        if (aPriority !== -1) return -1;
        if (bPriority !== -1) return 1;
        const labelA = WIDGET_GROUP_LABELS[a] || a;
        const labelB = WIDGET_GROUP_LABELS[b] || b;
        return labelA.localeCompare(labelB);
    });
}

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
    // ── Finance (Fixed) ─────────────────────────────────────
    'finance_income_total': {
        id: 'finance_income_total',
        name: 'Ingresos Totales',
        description: 'Muestra el total de ingresos y su tendencia',
        component: IncomeKpiWidget,
        defaultSpan: { w: 1, h: 1 },
        minSpan: { w: 1, h: 1 },
        category: 'financial',
        group: 'finance'
    },
    'finance_expense_total': {
        id: 'finance_expense_total',
        name: 'Egresos Totales',
        description: 'Muestra el total de egresos y su tendencia',
        component: ExpenseKpiWidget,
        defaultSpan: { w: 1, h: 1 },
        minSpan: { w: 1, h: 1 },
        category: 'financial',
        group: 'finance'
    },
    'finance_balance_net': {
        id: 'finance_balance_net',
        name: 'Balance Neto',
        description: 'Diferencia entre ingresos y egresos',
        component: BalanceKpiWidget,
        defaultSpan: { w: 1, h: 1 },
        minSpan: { w: 1, h: 1 },
        category: 'financial',
        group: 'finance'
    },
    'finance_evolution_chart': {
        id: 'finance_evolution_chart',
        name: 'Evolución Financiera',
        description: 'Gráfico histórico de ingresos vs egresos',
        component: FinancialEvolutionWidget,
        defaultSpan: { w: 4, h: 1 },
        minSpan: { w: 2, h: 1 },
        category: 'analytics',
        group: 'finance'
    },
    'finance_summary_combined': {
        id: 'finance_summary_combined',
        name: 'Resumen Financiero',
        description: 'KPIs principales y gráfico de evolución integrados',
        component: FinancialSummaryWidget,
        defaultSpan: { w: 4, h: 1 },
        minSpan: { w: 2, h: 1 },
        category: 'analytics',
        group: 'finance'
    },
    'finance_wallet_allocation': {
        id: 'finance_wallet_allocation',
        name: 'Distribución de Fondos',
        description: 'Balance por billetera',
        component: WalletDistributionWidget,
        defaultSpan: { w: 2, h: 1 },
        minSpan: { w: 1, h: 1 },
        category: 'financial',
        group: 'finance'
    },
    'finance_recent_activity_list': {
        id: 'finance_recent_activity_list',
        name: 'Últimos Movimientos',
        description: 'Lista de transacciones recientes',
        component: RecentTransactionsWidget,
        defaultSpan: { w: 2, h: 1 },
        minSpan: { w: 1, h: 1 },
        category: 'operational',
        group: 'finance'
    },
    'finance_quick_actions': {
        id: 'finance_quick_actions',
        name: 'Acciones Rápidas',
        description: 'Accesos directos a operaciones',
        component: QuickActionsWidget,
        defaultSpan: { w: 1, h: 1 },
        minSpan: { w: 1, h: 1 },
        category: 'operational',
        group: 'finance'
    },
    'finance_exchange_rate': {
        id: 'finance_exchange_rate',
        name: 'Cotización',
        description: 'Tipo de cambio actual',
        component: CurrencyExchangeWidget,
        defaultSpan: { w: 1, h: 1 },
        minSpan: { w: 1, h: 1 },
        category: 'financial',
        group: 'finance'
    },
    'finance_balance_summary': {
        id: 'finance_balance_summary',
        name: 'Resumen de Balance',
        description: 'Ingresos, egresos y balance con gráfico combinado',
        component: BalanceSummaryWidget,
        defaultSpan: { w: 4, h: 1 },
        minSpan: { w: 2, h: 1 },
        category: 'financial',
        group: 'finance'
    },

    // ── General (Parametric) ────────────────────────────────
    'activity_kpi': {
        id: 'activity_kpi',
        name: 'Actividad Reciente',
        description: 'Últimos eventos registrados (configurable por scope)',
        component: ActivityWidget,
        defaultSpan: { w: 2, h: 1 },
        minSpan: { w: 1, h: 1 },
        category: 'general',
        group: 'general',
        configurable: true,
        defaultConfig: { scope: 'organization' },
        href: '/organization?view=activity',
        configPanel: ({ config, onConfigChange }) => (
            <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Fuente de datos</label>
                <Select
                    value={config.scope || 'organization'}
                    onValueChange={(value) => onConfigChange({ ...config, scope: value })}
                >
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="organization">Organización</SelectItem>
                        <SelectItem value="finance">Finanzas</SelectItem>
                        <SelectItem value="project">Proyectos</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        ),
    },

    'upcoming_events': {
        id: 'upcoming_events',
        name: 'Próximos Eventos',
        description: 'Calendario y tareas con fechas próximas',
        component: UpcomingEventsWidget,
        defaultSpan: { w: 2, h: 1 },
        minSpan: { w: 1, h: 1 },
        category: 'general',
        group: 'general',
        configurable: true,
        defaultConfig: { scope: 'all' },
        href: '/organization/planner',
        configPanel: ({ config, onConfigChange }) => (
            <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Fuente de datos</label>
                <Select
                    value={config.scope || 'all'}
                    onValueChange={(value) => onConfigChange({ ...config, scope: value })}
                >
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todo</SelectItem>
                        <SelectItem value="calendar">Solo Calendario</SelectItem>
                        <SelectItem value="kanban">Solo Tareas</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        ),
    },

    'financial_summary': {
        id: 'financial_summary',
        name: 'Resumen Financiero',
        description: 'Ingresos, egresos y balance en moneda funcional',
        component: FinancialOverviewWidget,
        defaultSpan: { w: 2, h: 1 },
        minSpan: { w: 1, h: 1 },
        category: 'general',
        group: 'general',
        configurable: true,
        defaultConfig: { scope: 'organization' },
        href: '/organization/finance',
        configPanel: ({ config, onConfigChange }: { config: Record<string, any>; onConfigChange: (c: Record<string, any>) => void }) => (
            <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Alcance</label>
                <Select
                    value={config.scope || 'organization'}
                    onValueChange={(value: string) => onConfigChange({ ...config, scope: value })}
                >
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="organization">Organización</SelectItem>
                        <SelectItem value="project">Proyecto</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        ),
    },

    // ── Organization (Fixed) ────────────────────────────────
    'org_recent_projects': {
        id: 'org_recent_projects',
        name: 'Proyectos Recientes',
        description: 'Los proyectos con actividad más reciente',
        component: RecentProjectsWidget,
        defaultSpan: { w: 1, h: 1 },
        minSpan: { w: 1, h: 1 },
        category: 'general',
        group: 'organization',
        href: '/organization/projects',
    },

    'org_pulse': {
        id: 'org_pulse',
        name: 'Identidad',
        description: 'Logo, nombre, plan y estadísticas rápidas de la organización',
        component: OrgPulseWidget,
        defaultSpan: { w: 4, h: 2 },
        minSpan: { w: 2, h: 1 },
        category: 'general',
        group: 'organization',
    },

    'team_members': {
        id: 'team_members',
        name: 'Equipo',
        description: 'Miembros de la organización y estado de actividad',
        component: TeamMembersWidget,
        defaultSpan: { w: 1, h: 1 },
        minSpan: { w: 1, h: 1 },
        category: 'general',
        group: 'organization',
        href: '/organization/settings',
    },
};

// ============================================================================
// DEFAULT LAYOUTS PER DASHBOARD
// ============================================================================
// Each layout item defines position (x,y) and size (w,h) in a 4-column grid.
// x: column (0-3), y: row (0+), w: width in columns (1-4), h: height in rows (1+)
// react-grid-layout auto-compacts vertically.
// ============================================================================

/** Default layout for Finance Dashboard */
export const DEFAULT_FINANCE_LAYOUT: WidgetLayoutItem[] = [
    { id: 'finance_income_total', x: 0, y: 0, w: 2, h: 1 },
    { id: 'finance_expense_total', x: 2, y: 0, w: 2, h: 1 },
    { id: 'finance_balance_summary', x: 0, y: 1, w: 4, h: 1 },
    { id: 'finance_wallet_allocation', x: 0, y: 2, w: 2, h: 1 },
    { id: 'finance_recent_activity_list', x: 2, y: 2, w: 2, h: 1 },
    { id: 'finance_quick_actions', x: 0, y: 3, w: 1, h: 1 },
    { id: 'finance_exchange_rate', x: 1, y: 3, w: 1, h: 1 },
    { id: 'activity_kpi', x: 2, y: 3, w: 2, h: 1, config: { scope: 'finance' } },
];

/** Default layout for Organization Dashboard */
export const DEFAULT_ORG_LAYOUT: WidgetLayoutItem[] = [
    { id: 'org_pulse', x: 0, y: 0, w: 4, h: 2 },
    { id: 'org_recent_projects', x: 0, y: 2, w: 1, h: 2 },
    { id: 'upcoming_events', x: 1, y: 2, w: 1, h: 2, config: { scope: 'all' } },
    { id: 'team_members', x: 2, y: 2, w: 1, h: 2 },
    { id: 'activity_kpi', x: 3, y: 2, w: 1, h: 2, config: { scope: 'organization' } },
];
