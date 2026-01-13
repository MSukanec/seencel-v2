"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    MoreHorizontal,
    Eye,
    Edit,
    Users,
    BookOpen,
    Video,
    CheckCircle2,
    XCircle,
    Clock,
    Globe,
    Lock,
    EyeOff,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminCourse } from "@/features/admin/courses-queries";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

interface CoursesTableProps {
    courses: AdminCourse[];
}

function getStatusBadge(status: string) {
    switch (status) {
        case "available":
            return (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Disponible
                </Badge>
            );
        case "coming_soon":
            return (
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                    <Clock className="h-3 w-3 mr-1" />
                    Próximamente
                </Badge>
            );
        case "maintenance":
            return (
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                    <XCircle className="h-3 w-3 mr-1" />
                    Mantenimiento
                </Badge>
            );
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

function getVisibilityBadge(visibility: string) {
    switch (visibility) {
        case "public":
            return (
                <Badge variant="outline" className="text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    Público
                </Badge>
            );
        case "private":
            return (
                <Badge variant="outline" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Privado
                </Badge>
            );
        case "unlisted":
            return (
                <Badge variant="outline" className="text-xs">
                    <EyeOff className="h-3 w-3 mr-1" />
                    No listado
                </Badge>
            );
        default:
            return <Badge variant="outline">{visibility}</Badge>;
    }
}

function formatCurrency(amount: number | null): string {
    if (amount === null) return "Gratis";
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function CoursesTable({ courses }: CoursesTableProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Cursos</CardTitle>
                <Button>
                    + Nuevo Curso
                </Button>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Curso</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Visibilidad</TableHead>
                                <TableHead>Precio</TableHead>
                                <TableHead className="text-center">Contenido</TableHead>
                                <TableHead className="text-center">Alumnos</TableHead>
                                <TableHead>Creado</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No hay cursos creados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                courses.map((course) => (
                                    <TableRow key={course.id}>
                                        <TableCell>
                                            <div>
                                                <Link href={`/admin/courses/${course.id}`} className="font-medium hover:underline">
                                                    {course.title}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">/{course.slug}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(course.status)}</TableCell>
                                        <TableCell>{getVisibilityBadge(course.visibility)}</TableCell>
                                        <TableCell>
                                            <span className="font-medium">{formatCurrency(course.price)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1" title="Módulos">
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                    {course.modules_count}
                                                </span>
                                                <span className="flex items-center gap-1" title="Lecciones">
                                                    <Video className="h-3.5 w-3.5" />
                                                    {course.lessons_count}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="font-medium">{course.enrollments_count}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {format(new Date(course.created_at), "dd/MM/yy", { locale: es })}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Ver landing
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                    {courses.length} curso{courses.length !== 1 ? "s" : ""} en total
                </p>
            </CardContent>
        </Card>
    );
}
