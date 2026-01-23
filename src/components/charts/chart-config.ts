export const CHART_COLORS = {
    primary: "var(--primary)",
    primaryGradientStart: "var(--primary)", // Opacity handled in component
    primaryGradientEnd: "var(--primary)",

    // Semantic
    success: "#10b981", // emerald-500
    warning: "#f59e0b", // amber-500
    danger: "#ef4444", // red-500
    info: "#3b82f6", // blue-500
    neutral: "#71717a", // zinc-500

    // Categorical Palette (Enterprise-grade, accessible)
    categorical: [
        "var(--chart-1)",
        "var(--chart-2)",
        "var(--chart-3)",
        "var(--chart-4)",
        "var(--chart-5)",
        "#6366f1", // Indigo
        "#ec4899", // Pink
        "#14b8a6", // Teal
        "#f43f5e", // Rose
        "#8b5cf6", // Violet
    ]
};

export const CHART_DEFAULTS = {
    animationDuration: 1000,
    fontSize: 12,
    fontFamily: "var(--font-sans)",
    gridColor: "hsl(var(--border))",
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
    return Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(value);
};

