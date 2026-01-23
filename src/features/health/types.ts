export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | 'unknown';

export interface HealthMetric {
    id: string;
    label: string;
    score: number; // 0-100 normalized score
    weight: number; // Importance of this metric (0-1)
    status: HealthStatus;
    trend: 'improving' | 'stable' | 'deteriorating';

    // Contextual values (agnostic)
    currentValue: number | string;
    targetValue?: number | string;
    unit?: string;

    // Explanation
    message?: string;
    recommendation?: string;
}

export interface EntityHealth {
    entityId: string;
    entityType: string; // 'project', 'client', 'payment_flow', etc.

    overallScore: number; // 0-100 weighted average
    overallStatus: HealthStatus;
    lastCalculatedAt: string;

    metrics: HealthMetric[];

    // Top contributors to current score (positive or negative)
    highlights: string[];
}

// Rule Definition Interface (The engine)
export interface HealthRule<TContext = any> {
    id: string;
    name: string;
    description: string;
    weight: number;

    // The evaluator function
    evaluate: (context: TContext) => Omit<HealthMetric, 'id' | 'label' | 'weight'>;
}

// Explanation content for modals
export interface HealthExplanation {
    title: string;
    description: string;
    impact: string;
    examples?: string[];
    action: {
        title: string;
        description: string;
    };
}

