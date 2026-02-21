"use client";

import { useState, useOptimistic } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreHorizontal,
    Edit,
    Trash2,
    Linkedin,
    Youtube,
    Instagram,
} from "lucide-react";
import { toast } from "sonner";
import { deleteInstructor } from "@/features/academy/actions";
import { InstructorForm } from "@/features/academy/forms/instructor-form";
import { useRouter } from "next/navigation";

// Define locally since it's just DB structure
interface Instructor {
    id: string;
    name: string;
    title: string | null;
    bio: string | null;
    avatar_path: string | null;
    credentials: string[] | null;
    linkedin_url: string | null;
    youtube_url: string | null;
    instagram_url: string | null;
}

interface InstructorsTableProps {
    instructors: Instructor[];
}

export function InstructorsTable({ instructors }: InstructorsTableProps) {
    const router = useRouter();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);

    // 🚀 OPTIMISTIC UI: Instant visual updates for delete
    const [optimisticInstructors, setOptimisticInstructors] = useOptimistic(
        instructors,
        (current, removedId: string) => current.filter(i => i.id !== removedId)
    );

    const handleEdit = (instructor: Instructor) => {
        setEditingInstructor(instructor);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingInstructor(null);
        setIsFormOpen(true);
    };

    // 🚀 OPTIMISTIC DELETE: Instructor disappears instantly
    const handleDelete = (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este instructor?")) return;

        // Optimistic update - instructor disappears NOW
        setOptimisticInstructors(id);

        // Server action in background
        deleteInstructor(id).then(res => {
            if (res.success) {
                toast.success("Instructor eliminado");
            } else {
                toast.error(res.message);
                router.refresh(); // Recover on error
            }
        }).catch(() => {
            toast.error("Error al eliminar instructor");
            router.refresh();
        });
    };

    const getStorageUrl = (path: string | null) => {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${path}`;
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Instructores</CardTitle>
                    <Button onClick={handleCreate}>
                        + Nuevo Instructor
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Avatar</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Redes</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {optimisticInstructors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No hay instructores creados
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    optimisticInstructors.map((instructor) => (
                                        <TableRow key={instructor.id}>
                                            <TableCell>
                                                <Avatar>
                                                    <AvatarImage src={getStorageUrl(instructor.avatar_path)} />
                                                    <AvatarFallback>{instructor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">{instructor.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{instructor.title || "-"}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {instructor.linkedin_url && <Linkedin className="h-4 w-4 text-blue-600" />}
                                                    {instructor.youtube_url && <Youtube className="h-4 w-4 text-red-600" />}
                                                    {instructor.instagram_url && <Instagram className="h-4 w-4 text-pink-600" />}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(instructor)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(instructor.id)}
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
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
                    </div>
                </CardContent>
            </Card>

            <InstructorForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                instructor={editingInstructor}
            />
        </>
    );
}

