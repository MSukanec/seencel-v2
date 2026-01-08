"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { useEffect, useState } from "react";
import { DashboardData } from "@/features/admin/queries";
import { ChartTooltip, PieChartTooltip } from "@/components/ui/chart-tooltip";

interface AdminChartsProps {
    charts: DashboardData['charts'];
}

// Colors
const COLORS = ['#84cc16', '#10b981', '#06b6d4', '#8b5cf6']; // Lime, Emerald, Cyan, Violet

export function AdminCharts({ charts }: AdminChartsProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 h-[350px]">
                {[1, 2, 3, 4].map(i => <div key={i} className="bg-muted/10 rounded-xl animate-pulse" />)}
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 1. Engagement por Vista */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle className="text-base">Engagement por Vista</CardTitle>
                    <CardDescription>Tiempo promedio</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={charts.engagement} margin={{ left: 0, right: 10 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#888888' }} interval={0} />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" name="Sesiones" fill="#a3e635" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Actividad por Hora */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle className="text-base">Actividad por Hora</CardTitle>
                    <CardDescription>Sesiones por hora del día</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts.activityByHour}>
                                <defs>
                                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="hour" fontSize={10} tickLine={false} axisLine={false} interval={4} tick={{ fill: '#888888' }} />
                                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#a3e635', strokeWidth: 1 }} />
                                <Area type="monotone" name="Sesiones" dataKey="value" stroke="#a3e635" fillOpacity={1} fill="url(#colorActivity)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Crecimiento de Usuarios */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle className="text-base">Crecimiento de Usuarios</CardTitle>
                    <CardDescription>Registros por mes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts.userGrowth}>
                                <defs>
                                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#888888' }} />
                                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#a3e635', strokeWidth: 1 }} />
                                <Area type="monotone" name="Usuarios" dataKey="users" stroke="#a3e635" fillOpacity={1} fill="url(#colorGrowth)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 4. Fuentes de Adquisición */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle className="text-base">Fuentes de Adquisición</CardTitle>
                    <CardDescription>De dónde vienen los usuarios</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={charts.sources}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {charts.sources.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieChartTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Legend */}
                        <div className="absolute bottom-0 w-full flex justify-center gap-4 text-[10px] text-muted-foreground">
                            {charts.sources.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span>{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
