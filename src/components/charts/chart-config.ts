// ============================================
// GLOBAL CHART CONFIGURATION
// All chart components should use these values
// ============================================

export const CHART_COLORS = {
    primary: "var(--primary)",
    primaryGradientStart: "var(--primary)", // Opacity handled in component
    primaryGradientEnd: "var(--primary)",

    // Semantic — uses CSS variables from globals.css
    success: "var(--semantic-positive)",
    warning: "var(--semantic-warning)",
    danger: "var(--semantic-negative)",
    info: "var(--semantic-info)",
    neutral: "var(--semantic-neutral)",

    // Categorical Palette (uses CSS variables for theming)
    // Order matters: used sequentially in multi-series charts
    categorical: [
        "var(--chart-1)", // Oliva — Primary
        "var(--chart-2)", // Lavanda — Secondary
        "var(--chart-3)", // Naranja — Warm accent
        "var(--chart-4)", // Oro — Highlight
        "var(--chart-5)", // Cyan — Cool contrast
        "var(--chart-6)", // Violeta
        "var(--chart-7)", // Índigo
        "var(--chart-8)", // Rosa — Alert
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
    animationDuration: 2000,
    fontSize: 10,
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

/**
 * Capitalize first letter of a month label.
 * date-fns with locale 'es' returns lowercase months ("ene 26").
 * This converts to "Ene 26" for cleaner chart display.
 */
export const capitalizeMonth = (label: string): string => {
    return label.charAt(0).toUpperCase() + label.slice(1);
};
