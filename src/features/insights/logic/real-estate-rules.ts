
import { Insight, InsightContext, InsightRule, InsightSeverity } from "../types";

/**
 * "Upsell Opportunity" (Liquidity) Insight
 * 
 * Logic: Identifies PERCENTAGE of clients who have paid > X% of their total commitment.
 * Goal: Suggests that the sales team offer new investment opportunities.
 */
export const upsellLiquidityInsight: InsightRule = (context: InsightContext): Insight | null => {
    // 1. Validate data availability
    if (!context.clientSummaries || context.clientSummaries.length === 0) return null;

    // 2. Load Thresholds (default to 90%)
    const thresholdPercent = context.thresholds?.upsellLiquidity ?? 90;

    // 3. Find eligible clients
    const eligibleClients = context.clientSummaries.filter(client => {
        if (client.total_committed_amount <= 0) return false;
        const paidPct = (client.total_paid_amount / client.total_committed_amount) * 100;
        // Check if they are liquid (above threshold) AND not fully settled (optional, but maybe we want fully settled too?)
        // Let's include everyone above threshold.
        return paidPct >= thresholdPercent;
    });

    const count = eligibleClients.length;

    // 4. Evaluate Rule
    if (count > 0) {
        return {
            id: 'upsell-liquidity',
            title: `${count} Oportunidade${count > 1 ? 's' : ''} de Re-inversión`,
            description: `${count} cliente${count > 1 ? 's han' : ' ha'} pagado más del ${thresholdPercent}% de su unidad. Flujo ideal para ofrecer nuevos proyectos.`,
            severity: 'positive',
            icon: 'TrendingUp',
            actionHint: 'Ver candidatos',
            actions: [
                {
                    id: 'filter_upsell',
                    label: 'Ver candidatos',
                    type: 'filter', // Ideally we would implement a real filter for this
                    payload: { minPaid: thresholdPercent }
                }
            ],
            priority: 90
        };
    }

    return null;
};

/**
 * "Cash Flow Risk" (Late Payer) Insight
 * 
 * Logic: Identifies clients with high overdue balance ratio.
 * MVP: Since we don't have "Days Late" easily here without processing payments history heavily,
 * we will look for Significant Overdue Balance relative to Commitment.
 */
export const cashFlowRiskInsight: InsightRule = (context: InsightContext): Insight | null => {
    // 1. Validate data
    if (!context.clientSummaries || context.clientSummaries.length === 0) return null;

    // 2. Load Thresholds
    // Definition: Clients with > 80% UNPAID balance. 
    // They represent the highest exposure risk.
    const thresholdUnpaidPct = 80;

    // 3. Find high-exposure clients
    const highExposureClients = context.clientSummaries.filter(client => {
        if (client.total_committed_amount <= 0) return false;
        const unpaidPct = (client.balance_due / client.total_committed_amount) * 100;
        return unpaidPct >= thresholdUnpaidPct;
    });

    const count = highExposureClients.length;

    // 4. Evaluate Rule
    if (count > 0) {
        return {
            id: 'cash-flow-risk',
            title: `${count} Cliente${count > 1 ? 's' : ''} con Alta Exposición`,
            description: `${count} unidad${count > 1 ? 'es tienen' : ' tiene'} más del ${thresholdUnpaidPct}% del saldo pendiente. Revisar planes de pago.`,
            severity: 'warning',
            icon: 'AlertTriangle',
            actionHint: 'Analizar saldos',
            actions: [
                {
                    id: 'filter_risk',
                    label: 'Ver deudores',
                    type: 'filter',
                    payload: { minUnpaid: thresholdUnpaidPct }
                }
            ],
            priority: 40 // Higher priority than general info
        };
    }

    return null;
};
