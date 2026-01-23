import { EntityHealth, HealthMetric, HealthRule, HealthStatus } from "../types";

/**
 * Calculates the overall health score and status based on a list of metrics.
 */
export function calculateEntityHealth(
    entityId: string,
    entityType: string,
    metrics: HealthMetric[]
): EntityHealth {
    if (metrics.length === 0) {
        return {
            entityId,
            entityType,
            overallScore: 0,
            overallStatus: 'unknown',
            lastCalculatedAt: new Date().toISOString(),
            metrics: [],
            highlights: []
        };
    }

    // Calculate weighted average
    let totalScore = 0;
    let totalWeight = 0;

    metrics.forEach(m => {
        totalScore += m.score * m.weight;
        totalWeight += m.weight;
    });

    const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    const overallStatus = getStatusFromScore(overallScore);

    // Identify highlights (lowest performing metrics usually)
    const highlights = metrics
        .sort((a, b) => a.score - b.score) // Ascending (worst first)
        .slice(0, 3)
        .map(m => `${m.label}: ${m.status} (${Math.round(m.score)}%)`);

    return {
        entityId,
        entityType,
        overallScore,
        overallStatus,
        lastCalculatedAt: new Date().toISOString(),
        metrics,
        highlights
    };
}

export function getStatusFromScore(score: number): HealthStatus {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
}

