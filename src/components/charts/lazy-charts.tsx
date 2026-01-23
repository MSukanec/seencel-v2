'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * 🚀 Lazy-loaded Chart Components
 * 
 * Recharts is ~200KB. These dynamic imports ensure charts are only
 * loaded when actually rendered, reducing initial bundle size.
 * 
 * Usage:
 * import { LazyAreaChart, LazyDonutChart } from '@/components/charts/lazy-charts';
 */

// Chart loading skeleton
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
    <div className="w-full animate-pulse">
        <Skeleton className="w-full" style={{ height }} />
    </div>
);

// Area Charts
export const LazyAreaChart = dynamic(
    () => import('./area/base-area-chart').then(m => m.BaseAreaChart),
    {
        loading: () => <ChartSkeleton height={300} />,
        ssr: false
    }
);

export const LazyDualAreaChart = dynamic(
    () => import('./area/base-dual-area-chart').then(m => m.BaseDualAreaChart),
    {
        loading: () => <ChartSkeleton height={300} />,
        ssr: false
    }
);

// Bar Charts
export const LazyBarChart = dynamic(
    () => import('./bar/base-bar-chart').then(m => m.BaseBarChart),
    {
        loading: () => <ChartSkeleton height={300} />,
        ssr: false
    }
);

// Pie Charts
export const LazyPieChart = dynamic(
    () => import('./pie/base-pie-chart').then(m => m.BasePieChart),
    {
        loading: () => <ChartSkeleton height={250} />,
        ssr: false
    }
);

export const LazyDonutChart = dynamic(
    () => import('./pie/base-donut-chart').then(m => m.BaseDonutChart),
    {
        loading: () => <ChartSkeleton height={250} />,
        ssr: false
    }
);

// Line Charts
export const LazyLineChart = dynamic(
    () => import('./line/base-line-chart').then(m => m.BaseLineChart),
    {
        loading: () => <ChartSkeleton height={300} />,
        ssr: false
    }
);

