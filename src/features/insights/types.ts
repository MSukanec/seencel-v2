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

    // User/Meta Context
    isShortPeriod?: boolean; // If analyzing < 1 month
    daysCount?: number;
    monthCount?: number; // How many months in range
    paymentCount?: number; // Total operational volume

    // Financials
    totalIngresos?: number;
    totalEgresos?: number;
    balance?: number;

    // Optional extras used in specific legacy rules
    topCategoryName?: string;
    topCategoryPercentage?: number;
}

// Definition of a Rule Function
export type InsightRule = (context: InsightContext) => Insight | null;
