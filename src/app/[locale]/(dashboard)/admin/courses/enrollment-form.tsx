"use client";

import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { useModal } from "@/providers/modal-store";
import { toast } from "sonner";
import { FormFooter } from "@/components/global/form-footer";
import { createEnrollment, updateEnrollment, getEnrollableUsers, getEnrollableCourses, getExistingEnrollments } from "@/actions/enrollment-actions";
import type { AdminCourseEnrollment } from "@/features/admin/courses-queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface EnrollmentFormProps {
    initialData?: AdminCourseEnrollment;
    onSuccess?: () => void;
}

type User = { id: string; full_name: string | null; email: string; avatar_url: string | null };
type Course = { id: string; title: string; slug: string };
type ExistingEnrollment = { user_id: string; course_id: string };

export function EnrollmentForm({ initialData, onSuccess }: EnrollmentFormProps) {
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [existingEnrollments, setExistingEnrollments] = useState<ExistingEnrollment[]>([]);

    const [formData, setFormData] = useState({
        user_id: initialData?.user_id || "",
        course_id: initialData?.course_id || "",
        status: initialData?.status || "active",
        expires_at: initialData?.expires_at ? initialData.expires_at.split("T")[0] : "",
    });

    // Load users, courses, and existing enrollments on mount
    useEffect(() => {
        async function loadData() {
            try {
                const [usersData, coursesData, enrollmentsData] = await Promise.all([
                    getEnrollableUsers(),
                    getEnrollableCourses(),
                    getExistingEnrollments(),
                ]);
                setUsers(usersData);
                setCourses(coursesData);
                setExistingEnrollments(enrollmentsData);
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Error al cargar datos");
            } finally {
                setIsLoadingData(false);
            }
        }
        loadData();
    }, []);

    // Filter users: exclude those already enrolled in the selected course
    const availableUsers = useMemo(() => {
        if (!formData.course_id || initialData) {
            // If no course selected or editing, show all users
            return users;
        }

        // Get user IDs already enrolled in this course
        const enrolledUserIds = new Set(
            existingEnrollments
                .filter((e) => e.course_id === formData.course_id)
                .map((e) => e.user_id)
        );

        // Return only users not enrolled
        return users.filter((user) => !enrolledUserIds.has(user.id));
    }, [users, existingEnrollments, formData.course_id, initialData]);

    // Reset user selection when course changes (if user is no longer available)
    useEffect(() => {
        if (formData.course_id && formData.user_id && !initialData) {
            const isUserAvailable = availableUsers.some((u) => u.id === formData.user_id);
            if (!isUserAvailable) {
                setFormData((prev) => ({ ...prev, user_id: "" }));
            }
        }
    }, [formData.course_id, formData.user_id, availableUsers, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!formData.user_id || !formData.course_id) {
                toast.error("Selecciona usuario y curso");
                setIsLoading(false);
                return;
            }

            const dataToSave = {
                user_id: formData.user_id,
                course_id: formData.course_id,
                status: formData.status,
                expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
            };

            if (initialData) {
                await updateEnrollment(initialData.id, {
                    status: dataToSave.status,
                    expires_at: dataToSave.expires_at,
                });
                toast.success("Inscripción actualizada");
            } else {
                await createEnrollment(dataToSave);
                toast.success("Alumno inscrito correctamente");
            }

            if (onSuccess) onSuccess();
            closeModal();
        } catch (error: any) {
            console.error("Failed to save enrollment:", error);
            if (error.message?.includes("enroll_unique")) {
                toast.error("Este alumno ya está inscrito en este curso");
            } else {
                toast.error("Error al guardar la inscripción");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const selectedUser = users.find((u) => u.id === formData.user_id);

    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4">
                {/* Course Selector - FIRST */}
                <div className="space-y-2">
                    <Label>Curso</Label>
                    <Select
                        value={formData.course_id}
                        onValueChange={(value) => setFormData({ ...formData, course_id: value, user_id: "" })}
                        disabled={!!initialData}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un curso" />
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                    <span>{course.title}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* User Selector - SECOND (disabled until course is selected) */}
                <div className="space-y-2">
                    <Label>Alumno</Label>
                    <SearchableSelect
                        value={formData.user_id}
                        onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                        disabled={!!initialData || !formData.course_id}
                        placeholder={formData.course_id ? "Selecciona un alumno" : "Primero selecciona un curso"}
                        searchPlaceholder="Buscar alumno..."
                        emptyMessage={availableUsers.length === 0 ? "Todos los usuarios ya están inscriptos" : "No se encontraron alumnos"}
                        options={availableUsers.map(user => ({
                            value: user.id,
                            label: user.full_name || user.email,
                            searchTerms: user.email, // Allow searching by email too
                            content: (
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={user.avatar_url || undefined} />
                                        <AvatarFallback className="text-[10px]">
                                            {user.full_name?.[0] || user.email[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium leading-none">{user.full_name || "Sin nombre"}</span>
                                        <span className="text-xs text-muted-foreground leading-none">{user.email}</span>
                                    </div>
                                </div>
                            ),
                            selectedContent: (
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={user.avatar_url || undefined} />
                                        <AvatarFallback className="text-[10px]">
                                            {user.full_name?.[0] || user.email[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>{user.full_name || user.email}</span>
                                </div>
                            )
                        }))}
                    />
                </div>

                {/* Status Selector */}
                <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="completed">Completado</SelectItem>
                            <SelectItem value="expired">Expirado</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Expiration Date */}
                <div className="space-y-2">
                    <Label>Fecha de Vencimiento (opcional)</Label>
                    <Input
                        type="date"
                        value={formData.expires_at}
                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                        placeholder="Dejar vacío para acceso lifetime"
                    />
                    <p className="text-xs text-muted-foreground">
                        Dejar vacío para acceso de por vida (lifetime)
                    </p>
                </div>
            </div>

            <FormFooter
                onCancel={closeModal}
                isLoading={isLoading}
                submitLabel={initialData ? "Guardar Cambios" : "Inscribir Alumno"}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
