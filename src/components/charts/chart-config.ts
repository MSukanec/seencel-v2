// ============================================
// GLOBAL CHART CONFIGURATION
// All chart components should use these values
// ============================================

export const CHART_COLORS = {
    primary: "var(--primary)",
    primaryGradientStart: "var(--primary)", // Opacity handled in component
    primaryGradientEnd: "var(--primary)",

    // Semantic
    success: "var(--chart-6)", // Emerald
    warning: "#f59e0b", // amber-500
    danger: "var(--chart-8)", // Rose
    info: "var(--chart-5)", // Cyan
    neutral: "#71717a", // zinc-500

    // Categorical Palette (uses CSS variables for theming)
    // Order matters: used sequentially in multi-series charts
    categorical: [
        "var(--chart-1)", // Violet
        "var(--chart-2)", // Pink
        "var(--chart-3)", // Orange
        "var(--chart-4)", // Yellow
        "var(--chart-5)", // Cyan
        "var(--chart-6)", // Emerald
        "var(--chart-7)", // Indigo
        "var(--chart-8)", // Rose
    ]
};

// Gradient definitions for area/bar charts
// Use these IDs in fill="url(#gradientId)"
export const CHART_GRADIENTS = {
    // Dual area chart gradients
    primary: {
        id: "gradientPrimary",
        startColor: "var(--chart-1)",
        endColor: "var(--chart-1)",
        startOpacity: 0.4,
        endOpacity: 0.05,
    },
    secondary: {
        id: "gradientSecondary",
        startColor: "var(--chart-2)",
        endColor: "var(--chart-2)",
        startOpacity: 0.4,
        endOpacity: 0.05,
    },
    // Financial semantic gradients
    income: {
        id: "gradientIncome",
        startColor: "var(--chart-6)", // Emerald
        endColor: "var(--chart-6)",
        startOpacity: 0.5,
        endOpacity: 0.05,
    },
    expense: {
        id: "gradientExpense",
        startColor: "var(--chart-8)", // Rose
        endColor: "var(--chart-8)",
        startOpacity: 0.4,
        endOpacity: 0.05,
    },
};

export const CHART_DEFAULTS = {
    animationDuration: 1000,
    fontSize: 12,
    fontFamily: "var(--font-sans)",
    gridColor: "hsl(var(--border))",
    // Gradient intensity for area fills
    gradientOpacity: {
        start: 0.4,  // Top of gradient
        end: 0.05,   // Bottom of gradient (near zero for fade effect)
    },
    tooltipStyle: {
        backgroundColor: "hsl(var(--background))",
        borderColor: "hsl(var(--border))",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        padding: "8px 12px",
    }
};

export const formatCurrency = (value: number) => {
    // Use es-AR for number formatting (1.000,00) but with USD symbol prefix
    return `US$ ${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
};

export const formatCompactNumber = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absValue >= 1_000_000_000) {
        return `${sign}${(absValue / 1_000_000_000).toFixed(1).replace('.0', '')}B`;
    }
    if (absValue >= 1_000_000) {
        return `${sign}${(absValue / 1_000_000).toFixed(1).replace('.0', '')}M`;
    }
    if (absValue >= 1_000) {
        return `${sign}${(absValue / 1_000).toFixed(1).replace('.0', '')}K`;
    }
    return `${sign}${absValue.toFixed(0)}`;
};

// Helper to get color by index (cycles through palette)
export const getChartColor = (index: number): string => {
    return CHART_COLORS.categorical[index % CHART_COLORS.categorical.length];
};
