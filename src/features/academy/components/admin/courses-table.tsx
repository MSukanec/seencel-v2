"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, BookOpen, Layers, Trash, Lock, EyeOff, Users, Video, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useLocale } from "next-intl";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { AdminCourse } from "@/features/admin/academy-queries";

// Modals
import { useModal } from "@/providers/modal-store";
import { CreateCourseForm } from "./create-course-form";
import { GeneralForm, type EditableCourseData } from "@/features/academy/components/admin/course-details/general-form";
import { DeleteCourseConfirm } from "./delete-course-confirm";

function getStatusBadge(status: string) {
    switch (status) {
        case "published":
            return <Badge variant="default">Publicado</Badge>;
        case "draft":
            return <Badge variant="secondary">Borrador</Badge>;
        case "archived":
            return <Badge variant="outline">Archivado</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}

function getVisibilityBadge(visibility: string) {
    switch (visibility) {
        case "public":
            return <Badge variant="default">Público</Badge>;
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

export function CoursesTable({ courses, instructors }: { courses: AdminCourse[], instructors: { id: string; name: string; avatar_path: string | null }[] }) {
    const locale = useLocale();
    const { openModal } = useModal();

    const handleCreate = () => {
        openModal(
            <CreateCourseForm instructors={instructors} />,
            {
                title: "Crear Nuevo Curso",
                description: "Ingresa la información básica para dar de alta el curso.",
                size: "md"
            }
        );
    };

    const handleEdit = (course: AdminCourse) => {
        // Map AdminCourse to EditableCourseData
        const courseData: EditableCourseData = {
            id: course.id,
            title: course.title,
            slug: course.slug,
            price: course.price || 0,
            status: course.status,
            visibility: course.visibility,
            instructorId: course.instructorId,
            endorsement: course.endorsement ? {
                title: course.endorsement.title || "",
                description: course.endorsement.description || "",
                imagePath: course.endorsement.imagePath || null,
            } : undefined,
        };

        openModal(
            <GeneralForm course={courseData} instructors={instructors} isModal />,
            {
                title: "Editar Curso",
                description: "Modifica los detalles generales del curso.",
                size: "lg"
            }
        );
    };

    const handleDelete = (course: AdminCourse) => {
        openModal(
            <DeleteCourseConfirm courseId={course.id} courseTitle={course.title} />,
            {
                title: "Eliminar Curso",
                description: "Esta acción no se puede deshacer.",
                size: "sm"
            }
        );
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Cursos</CardTitle>
                <Button onClick={handleCreate}>
                    + Nuevo Curso
                </Button>
            </CardHeader>
            <CardContent>
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
                                            <Link href={`/admin/academy/${course.id}`} className="font-medium hover:underline">
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
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/${locale}/admin/academy/${course.id}`}>
                                                        <BookOpen className="h-4 w-4 mr-2" />
                                                        Gestionar Contenido
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEdit(course)}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(course)}
                                                    className="text-red-600 focus:text-red-500"
                                                >
                                                    <Trash className="h-4 w-4 mr-2" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
