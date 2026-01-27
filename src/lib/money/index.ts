/**
 * Money Module - Public API
 * 
 * This is the single entry point for all money-related functionality.
 * Import everything from here: `import { ... } from '@/lib/money'`
 * 
 * ARCHITECTURE:
 * - money.ts         → Types and Money creation
 * - money-service.ts → Conversions and calculations
 * - money-formatter.ts → Display formatting
 * - kpi-calculator.ts → KPI calculations
 */

// Types
export type {
    Money,
    MoneyInput,
    MoneyConfig,
    Currency,
    DisplayMode,
} from './money';

// Money creation
export {
    createMoney,
    createFunctionalMoney,
    zeroMoney,
    isMoney,
    DEFAULT_CONFIG,
} from './money';

// Money Service - Conversions & Calculations
export type {
    CurrencyBreakdown,
    MoneySum,
} from './money-service';

export {
    convertToFunctional,
    convertToSecondary,
    calculateDisplayAmount,
    sumMoney,
    sumMoneyWithSign,
    groupAndSumMoney,
} from './money-service';

// Formatter
export type {
    FormatOptions,
} from './money-formatter';

export {
    formatMoney,
    formatAmount,
    formatCurrencyNative,
    formatPercent,
} from './money-formatter';

// KPI Calculator
export type {
    KPIMovement,
    FinanceKPIs,
    CashFlowDataPoint,
    WalletBalance,
} from './kpi-calculator';

export {
    calculateFinanceKPIs,
    calculateCashFlowData,
    calculateWalletBalances,
} from './kpi-calculator';
