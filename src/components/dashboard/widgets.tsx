"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Briefcase, Activity, Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Project Table ---
export function ProjectTable({ projects }: { projects: any[] }) {
    const activeProjects = projects.slice(0, 5);

    return (
        <div className="bg-card border border-border rounded-xl flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Briefcase className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold">Estado de Proyectos</h3>
                </div>
                <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Ver Todos
                </button>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-3">Proyecto</th>
                            <th className="px-6 py-3 text-right">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {activeProjects.map((project) => (
                            <tr key={project.id} className="hover:bg-muted/20 transition-colors group">
                                <td className="px-6 py-4 font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-8 rounded-full" style={{ backgroundColor: project.color || '#3b82f6' }}></div>
                                        <div>
                                            <div className="text-foreground">{project.name}</div>
                                            <div className="text-xs text-muted-foreground font-normal sm:hidden">Activo</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        Activo
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {activeProjects.length === 0 && (
                            <tr>
                                <td colSpan={2} className="px-6 py-8 text-center text-muted-foreground">
                                    Sin proyectos activos.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- Activity Feed ---
export function ActivityFeed({ activity }: { activity: any[] }) {
    return (
        <div className="bg-card border border-border rounded-xl flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-border flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Activity className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Actividad</h3>
                    <p className="text-xs text-muted-foreground">En tiempo real</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0 relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-px bg-border/50"></div>

                {activity.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Sin actividad reciente</p>
                    </div>
                ) : (
                    <div className="py-4 space-y-4">
                        {activity.map((log: any, i) => (
                            <div key={log.id || i} className="px-6 relative flex gap-4">
                                <div className="relative z-10 mt-1">
                                    <div className="w-4 h-4 rounded-full bg-background border-2 border-primary ring-4 ring-background"></div>
                                </div>
                                <div className="flex-1 pb-4 border-b border-border/40 last:border-0">
                                    <p className="text-sm font-medium text-foreground">
                                        <span className="text-primary">{log.details?.user_name || 'Usuario'}</span>
                                        {' '}
                                        <span className="text-muted-foreground font-normal">{log.action_description}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
