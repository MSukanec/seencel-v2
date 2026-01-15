"use client";

import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";

export function ProjectStatusCard({ projects, className }: { projects: any[], className?: string }) {
    const activeProjects = projects.slice(0, 5);

    return (
        <div className={cn("bg-card border border-border rounded-xl flex flex-col h-full overflow-hidden", className)}>
            <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Briefcase className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold">Estado de Proyectos</h3>
                </div>
                <Link href="/organization/projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Ver Todos
                </Link>
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
