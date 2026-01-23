
/**
 * Detects the direction of a trend in a series of numbers.
 * @param values Array of numerical values (ordered chronologically)
 * @param options Configuration options
 */
export function detectTrendDirection(
    values: number[],
    options: { minDataPoints?: number; stableThresholdPercent?: number } = {}
): {
    direction: 'increasing' | 'decreasing' | 'stable';
    confidence: 'low' | 'high';
    monthlyChangePercent: number;
} | null {
    const { minDataPoints = 3, stableThresholdPercent = 5 } = options;

    if (values.length < minDataPoints) return null;

    // Simple linear regression to find slope
    const n = values.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const average = sumY / n;

    // Calculate percentage change per step based on average
    const monthlyChangePercent = average !== 0 ? (slope / average) * 100 : 0;
    const absChange = Math.abs(monthlyChangePercent);

    if (absChange < stableThresholdPercent) {
        return { direction: 'stable', confidence: 'high', monthlyChangePercent };
    }

    // Determine confidence based on R-squared (coefficient of determination)
    // calculating SST (total sum of squares) and SSR (sum of squared residuals)
    const intercept = (sumY - slope * sumX) / n;
    let ssTotal = 0;
    let ssRes = 0;

    for (let i = 0; i < n; i++) {
        const predicted = slope * i + intercept;
        ssTotal += Math.pow(values[i] - average, 2);
        ssRes += Math.pow(values[i] - predicted, 2);
    }

    // Avoid division by zero
    const rSquared = ssTotal !== 0 ? 1 - (ssRes / ssTotal) : 0;

    const confidence = rSquared > 0.6 ? 'high' : 'low';

    return {
        direction: monthlyChangePercent > 0 ? 'increasing' : 'decreasing',
        confidence,
        monthlyChangePercent
    };
}

/**
 * Projects the year-end spend based on current data.
 * @param currentValues Values so far this year
 * @param currentMonth Index of the current month (1-12)
 */
export function projectYearEndSpend(
    currentValues: number[],
    currentMonth: number,
    options: { minDataPoints?: number } = {}
): {
    projectedTotal: number;
    changePercent: number; // vs linear projection or vs last year (simplified to vs linear avg here)
    direction: 'up' | 'down' | 'stable';
    monthsRemaining: number;
} | null {
    const minDataPoints = options.minDataPoints || 3;

    if (currentValues.length < minDataPoints) return null;

    const trend = detectTrendDirection(currentValues, { minDataPoints });
    if (!trend) return null;

    const monthsRemaining = 12 - currentMonth;
    if (monthsRemaining <= 0) return null;

    // Calculate current total
    const currentTotal = currentValues.reduce((a, b) => a + b, 0);

    // Average of last 3 months
    const last3Avg = currentValues.slice(-3).reduce((a, b) => a + b, 0) / 3;

    // Basic projection: assume average of last 3 months continues
    // Could accept a 'growth' parameter, but let's stick to simple run-rate for now 
    // or use the slope from detection if high confidence.

    let projectedFutureSpend = 0;

    if (trend.confidence === 'high' && trend.direction !== 'stable') {
        const lastValue = currentValues[currentValues.length - 1];
        // Apply compound growth for remaining months
        let val = lastValue;
        for (let i = 0; i < monthsRemaining; i++) {
            val = val * (1 + (trend.monthlyChangePercent / 100));
            projectedFutureSpend += val;
        }
    } else {
        // Fallback to average run rate
        projectedFutureSpend = last3Avg * monthsRemaining;
    }

    const projectedAnnualTotal = currentTotal + projectedFutureSpend;

    // Compare against a simple "if average continued forever" baseline (linear projection)
    const average = currentTotal / currentValues.length;
    const linearAnnualTotal = average * 12;

    const changePercent = ((projectedAnnualTotal - linearAnnualTotal) / linearAnnualTotal) * 100;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (changePercent > 5) direction = 'up';
    if (changePercent < -5) direction = 'down';

    return {
        projectedTotal: projectedAnnualTotal,
        changePercent,
        direction,
        monthsRemaining
    };
}

/**
 * Formats the projection insight text.
 */
export function formatProjectionInsight(
    projection: NonNullable<ReturnType<typeof projectYearEndSpend>>,
    type: 'yearEnd'
): string {
    const percent = Math.abs(Math.round(projection.changePercent));
    const directionText = projection.direction === 'up' ? 'mayor' : 'menor';

    return `Se proyecta un cierre anual un ${percent}% ${directionText} a lo esperado si se mantiene la tendencia actual.`;
}

