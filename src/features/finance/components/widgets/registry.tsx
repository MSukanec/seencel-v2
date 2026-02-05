import { WidgetDefinition, WidgetSize } from "./types";
import { IncomeKpiWidget } from "./core/income-kpi-widget";
import { ExpenseKpiWidget } from "./core/expense-kpi-widget";
import { BalanceKpiWidget } from "./core/balance-kpi-widget";
import { BalanceSummaryWidget } from "./core/balance-summary-widget";
import { ActivityKpiWidget } from "./core/activity-kpi-widget";
import { FinancialEvolutionWidget } from "./core/financial-evolution-widget";
import { FinancialSummaryWidget } from "./core/financial-summary-widget";
import { WalletDistributionWidget } from "./core/wallet-distribution-widget";
import { RecentTransactionsWidget } from "./core/recent-transactions-widget";
import { QuickActionsWidget } from "./core/quick-actions-widget";
import { CurrencyExchangeWidget } from "./core/currency-exchange-widget";

export const FINANCE_WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
    'finance_income_total': {
        id: 'finance_income_total',
        name: 'Ingresos Totales',
        description: 'Muestra el total de ingresos y su tendencia',
        component: IncomeKpiWidget,
        defaultSize: 'sm',
        category: 'financial'
    },
    'finance_expense_total': {
        id: 'finance_expense_total',
        name: 'Egresos Totales',
        description: 'Muestra el total de egresos y su tendencia',
        component: ExpenseKpiWidget,
        defaultSize: 'sm',
        category: 'financial'
    },
    'finance_balance_net': {
        id: 'finance_balance_net',
        name: 'Balance Neto',
        description: 'Diferencia entre ingresos y egresos',
        component: BalanceKpiWidget,
        defaultSize: 'sm',
        category: 'financial'
    },
    'finance_activity_volume': {
        id: 'finance_activity_volume',
        name: 'Volumen de Actividad',
        description: 'Cantidad de movimientos registrados',
        component: ActivityKpiWidget,
        defaultSize: 'sm',
        category: 'operational'
    },
    'finance_evolution_chart': {
        id: 'finance_evolution_chart',
        name: 'Evolución Financiera',
        description: 'Gráfico histórico de ingresos vs egresos',
        component: FinancialEvolutionWidget,
        defaultSize: 'wide',
        category: 'analytics'
    },
    'finance_summary_combined': {
        id: 'finance_summary_combined',
        name: 'Resumen Financiero',
        description: 'KPIs principales y gráfico de evolución integrados',
        component: FinancialSummaryWidget,
        defaultSize: 'wide',
        category: 'analytics'
    },
    'finance_wallet_allocation': {
        id: 'finance_wallet_allocation',
        name: 'Distribución de Fondos',
        description: 'Balance por billetera',
        component: WalletDistributionWidget,
        defaultSize: 'md',
        category: 'financial'
    },
    'finance_recent_activity_list': {
        id: 'finance_recent_activity_list',
        name: 'Últimos Movimientos',
        description: 'Lista de transacciones recientes',
        component: RecentTransactionsWidget,
        defaultSize: 'md',
        category: 'operational'
    },
    'finance_quick_actions': {
        id: 'finance_quick_actions',
        name: 'Acciones Rápidas',
        description: 'Accesos directos a operaciones',
        component: QuickActionsWidget,
        defaultSize: 'sm',
        category: 'operational'
    },
    'finance_exchange_rate': {
        id: 'finance_exchange_rate',
        name: 'Cotización',
        description: 'Tipo de cambio actual',
        component: CurrencyExchangeWidget,
        defaultSize: 'sm',
        category: 'financial'
    },
    'finance_balance_summary': {
        id: 'finance_balance_summary',
        name: 'Resumen de Balance',
        description: 'Ingresos, egresos y balance con gráfico combinado',
        component: BalanceSummaryWidget,
        defaultSize: 'wide',
        category: 'financial'
    }
};

// Default layout for new users (The "Bento Showroom")
export const DEFAULT_FINANCE_LAYOUT: { id: string; size: WidgetSize }[] = [
    // Row 1: KPI Cards with charts
    { id: 'finance_income_total', size: 'md' },
    { id: 'finance_expense_total', size: 'md' },

    // Row 2: Balance Summary (the new combined widget)
    { id: 'finance_balance_summary', size: 'wide' },

    // Row 3: Analysis & Detail
    { id: 'finance_wallet_allocation', size: 'md' },
    { id: 'finance_recent_activity_list', size: 'md' },

    // Row 4: Tools & Small KPIs
    { id: 'finance_quick_actions', size: 'sm' },
    { id: 'finance_exchange_rate', size: 'sm' },
    { id: 'finance_activity_volume', size: 'sm' }
];
