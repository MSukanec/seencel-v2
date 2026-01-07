import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/server";
import { AdminCharts } from "./admin-charts";

import { Link } from "@/i18n/routing";
import { MessageSquare } from "lucide-react";

// Define types for our data
type UserStats = {
    total_users: number;
    active_users_now: number;
    new_users_this_month: number;
    total_organizations: number;
    active_users_today: number;
};

type MonthlyGrowth = {
    month: string;
    new_users: number;
};

type FinancialMovement = {
    amount: number;
    payment_date: string;
    movement_type: string;
    amount_sign: number;
};

export default async function AdminDashboard() {
    // const t = await useTranslations('Common'); // Unused and potentially causing error

    const supabase = await createClient();

    let errors: string[] = [];

    // 1. Fetch User Stats
    const { data: userStatsData, error: userStatsError } = await supabase
        .from('user_stats_summary_view')
        .select('*')
        .single();

    if (userStatsError) errors.push(`User Stats: ${userStatsError.message}`);

    const userStats = (userStatsData as UserStats) || {
        total_users: 0,
        active_users_now: 0,
        new_users_this_month: 0,
        total_organizations: 0,
        active_users_today: 0
    };

    // 2. Fetch User Growth
    const { data: growthData, error: growthError } = await supabase
        .from('user_monthly_growth_view')
        .select('*')
        .order('month', { ascending: true })
        .limit(6);

    if (growthError) errors.push(`Growth Data: ${growthError.message}`);

    // 3. Fetch Financials
    const { data: movements, error: movementsError } = await supabase
        .from('unified_financial_movements_view')
        .select('amount, payment_date, amount_sign, movement_type')
        .eq('status', 'confirmed')
        .order('payment_date', { ascending: false })
        .limit(1000);

    if (movementsError) errors.push(`Financials: ${movementsError.message}`);

    // Client-side aggregation
    const totalRevenue = (movements || []).reduce((acc: number, curr: any) => {
        if (curr.amount_sign > 0) return acc + curr.amount;
        return acc;
    }, 0) || 0;

    const salesCount = (movements || []).filter((m: any) => m.movement_type === 'client_payment').length || 0;

    // Prepare Chart Data
    const revenueByMonth = (movements || []).reduce((acc: any, curr: any) => {
        if (!curr.payment_date) return acc;
        const month = curr.payment_date.substring(0, 7); // YYYY-MM
        if (curr.amount_sign > 0) {
            acc[month] = (acc[month] || 0) + curr.amount;
        }
        return acc;
    }, {});

    const revenueChartData = Object.keys(revenueByMonth).map(month => ({
        name: month,
        revenue: revenueByMonth[month]
    })).sort((a: any, b: any) => a.name.localeCompare(b.name)).slice(-6);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                <p className="text-muted-foreground">
                    System-wide overview and metrics.
                </p>
            </div>

            {errors.length > 0 && (
                <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-sm">
                    <p className="font-semibold">Error Loading Some Data:</p>
                    <ul className="list-disc list-inside mt-1">
                        {errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue (Est.)</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRevenue)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Based on recent transactions
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userStats.total_users}</div>
                        <p className="text-xs text-muted-foreground">
                            +{userStats.new_users_this_month} this month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sales Count</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <path d="M2 10h20" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{salesCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Confirmed client payments
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userStats.active_users_now}</div>
                        <p className="text-xs text-muted-foreground">
                            Today: {userStats.active_users_today}
                        </p>
                    </CardContent>
                </Card>
                <Link href={"/admin/feedback" as any}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Feedback</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                { /*Ideally we fetch this count efficiently*/}
                                View
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Read user messages
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Charts Component (Client Side) - dynamically loaded */}
            <AdminCharts revenueData={revenueChartData} userData={growthData || []} />
        </div>
    );
}
