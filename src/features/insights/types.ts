export type InsightSeverity = 'info' | 'warning' | 'critical' | 'positive'; // Legacy uses info/warning/alert/positive. We map critical<->alert.

// --- ACTION SYSTEM ---
export type InsightActionType = 'navigate' | 'filter' | 'open';

export interface InsightAction {
    id: string;
    label: string;
    type: InsightActionType;
    payload: Record<string, unknown>; // Flexible payload for navigation/filtering parameters

    // Optional compatibility hook for direct onClick functions (client-side generated)
    // Legacy did not have this, it used a central handler. We keep it for backward compatibility during migration.
    onClick?: () => void;
}

export interface InsightThresholds {
    growthSignificant: number; // % change to be considered significant (default 15)
    trendStable: number;      // % change to be considered stable (default 4)
    concentrationPareto: number; // % accumulated for concentration (default 80)
    minDataPoints: number;    // Min months for trend (default 3)
    upsellLiquidity: number;  // % paid to trigger upsell (default 90)
    cashFlowRisk: number;     // % overdue or days/count to trigger risk (default TBD, maybe 10% balance or specific flag)
}

// --- INSIGHT DEFINITION ---
export interface Insight {
    id: string;
    title: string;
    description: string;
    severity: InsightSeverity; // Legacy maps: alert->critical, warning->warning, info->info

    // Extended fields from Legacy
    icon?: string; // String name of icon (e.g. 'TrendingUp') - or we can keep passing ReactNode if purely client-side
    priority?: number; // For sorting
    context?: string; // "Extra functionality" text (e.g. small footer text)
    actionHint?: string; // "Call to action" text hint

    actions?: InsightAction[]; // The new robust action system

    // Legacy/Compatibility fields (to be deprecated eventually)
    actionLabel?: string;
    actionUrl?: string; // Server side remnant
}

// --- CONTEXT & RULES ---
// The data shape required to run the rules. 
// This unifies "what data is available" for any insight calculation.
export interface InsightContext {
    // Current Period Data
    totalGasto?: number; // Total expense current period
    currentMonth?: number; // 1-12

    // Analysis Data
    monthlyData: { month: string; value: number; balance?: number }[]; // For trend analysis
    monthlyFinancialData?: { month: string; balance: number }[]; // Specifically for balance insights

    categoryData: { name: string; value: number }[]; // For concentration analysis
    previousCategoryData?: { name: string; value: number }[]; // For growth explanation

    paymentsByConcept?: { conceptName: string; paymentsCount: number }[]; // For consolidation
    projectFinancialData?: { projectName: string; income: number; expense: number }[]; // For project dependency
    clientSummaries?: {
        client_id: string;
        total_committed_amount: number;
        total_paid_amount: number;
        balance_due: number;
        currency_code: string | null;
    }[]; // For aggregate real estate analysis

    // User/Meta Context
    isShortPeriod?: boolean; // If analyzing < 1 month
    daysCount?: number;
    monthCount?: number; // How many months in range
    paymentCount?: number; // Total operational volume

    // Configuration
    thresholds?: InsightThresholds;

    // Financials
    totalValue?: number; // Universal field for rules (can map to income or expense)
    totalIngresos?: number;
    totalEgresos?: number;
    balance?: number;

    // Reporting labels (for generic rules to use standard terms like "gasto" or "cobro")
    termLabels?: {
        singular: string;
        plural: string;
        verbIncrease: string;
        verbDecrease: string;
    };

    // Optional extras used in specific legacy rules
    topCategoryName?: string;
    topCategoryPercentage?: number;
}

// Definition of a Rule Function
export type InsightRule = (context: InsightContext) => Insight | null;

