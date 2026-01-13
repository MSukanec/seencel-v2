"use client";

import { useState } from "react";
import { Course, Module, Lesson } from "@/components/course/mock-course-data";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, GripVertical, Video, Lock, Unlock } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    createModule, updateModule, deleteModule,
    createLesson, updateLesson, deleteLesson
} from "@/features/courses/course-actions";
import { cn } from "@/lib/utils";

interface ContentEditorProps {
    course: Course;
}

export function ContentEditor({ course }: ContentEditorProps) {
    const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState("");
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    async function handleCreateModule() {
        if (!newModuleTitle.trim() || !course.id) return;
        setIsPending(true);
        const res = await createModule(course.id, newModuleTitle);
        setIsPending(false);
        if (res.success) {
            toast.success("Módulo creado");
            setNewModuleTitle("");
            setIsCreateModuleOpen(false);
            router.refresh();
        } else {
            toast.error(res.message);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Contenido del Curso</h3>
                <Dialog open={isCreateModuleOpen} onOpenChange={setIsCreateModuleOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Módulo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Módulo</DialogTitle>
                            <DialogDescription>
                                Agrega una nueva sección para organizar tus lecciones.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre del Módulo</Label>
                                <Input
                                    id="name"
                                    value={newModuleTitle}
                                    onChange={(e) => setNewModuleTitle(e.target.value)}
                                    placeholder="Ej: Introducción"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateModuleOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCreateModule} disabled={isPending}>
                                {isPending ? "Creando..." : "Crear Módulo"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-6" defaultValue={course.modules[0]?.id}>
                {course.modules.map((module) => (
                    <ModuleItem key={module.id} module={module} courseId={course.id!} />
                ))}
            </Accordion>

            {course.modules.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                    No hay módulos creados. Comienza agregando uno.
                </div>
            )}
        </div>
    );
}

function ModuleItem({ module, courseId }: { module: Module; courseId: string }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editTitle, setEditTitle] = useState(module.title);
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    // Lesson state
    const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
    const [newLessonTitle, setNewLessonTitle] = useState("");

    async function handleUpdateModule() {
        if (!editTitle.trim()) return;
        setIsPending(true);
        const res = await updateModule(module.id, editTitle, courseId);
        setIsPending(false);
        if (res.success) {
            toast.success("Módulo actualizado");
            setIsEditOpen(false);
            router.refresh();
        } else {
            toast.error(res.message);
        }
    }

    async function handleDeleteModule() {
        if (!confirm("¿Estás seguro? Se eliminarán todas las lecciones.")) return;
        const res = await deleteModule(module.id, courseId);
        if (res.success) {
            toast.success("Módulo eliminado");
            router.refresh();
        } else {
            toast.error(res.message);
        }
    }

    async function handleCreateLesson() {
        if (!newLessonTitle.trim()) return;
        setIsPending(true);
        const res = await createLesson(module.id, newLessonTitle, courseId);
        setIsPending(false);
        if (res.success) {
            toast.success("Lección creada");
            setNewLessonTitle("");
            setIsAddLessonOpen(false);
            router.refresh();
        } else {
            toast.error(res.message);
        }
    }

    return (
        <AccordionItem value={module.id} className="border-0 rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="relative group/item">
                <AccordionTrigger className={cn(
                    "relative hover:no-underline py-0 px-0 min-h-[90px]",
                    "data-[state=open]:rounded-b-none"
                )}>
                    {/* Background Image & Overlay */}
                    <div className="absolute inset-0 z-0 text-left">
                        {module.imagePath ? (
                            <img
                                src={module.imagePath}
                                alt={module.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full bg-muted/40" />
                        )}
                        {/* Darker overlay for better text contrast */}
                        <div className="absolute inset-0 bg-black/60 transition-opacity group-hover/item:bg-black/70" />
                    </div>

                    {/* Content Layer (z-10) */}
                    <div className="relative z-10 flex items-center w-full px-6 text-white group-data-[state=open]/item:text-white">
                        <GripVertical className="w-5 h-5 text-white/50 mr-4 cursor-grab hover:text-white shrink-0" />

                        <div className="flex flex-col text-left flex-1 mr-24 py-6">
                            <span className="font-bold text-xl leading-tight text-white mb-2 shadow-black/50 drop-shadow-md">
                                {module.title}
                            </span>
                            <div className="flex items-center text-xs text-white/90 font-medium tracking-wide">
                                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                    {module.lessons.length} LECCIONES
                                </span>
                            </div>
                        </div>
                    </div>
                </AccordionTrigger>

                {/* Actions - Positioned absolutely on the RIGHT */}
                <div className="absolute right-14 top-1/2 -translate-y-1/2 z-20 flex items-center gap-2">
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/20 h-9 w-9 rounded-full" onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}>
                                <Pencil className="w-4 h-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent onClick={(e) => e.stopPropagation()}>
                            <DialogHeader>
                                <DialogTitle>Editar Módulo</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Nombre</Label>
                                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleUpdateModule} disabled={isPending}>Guardar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button size="icon" variant="ghost" className="text-white/70 hover:text-red-400 hover:bg-white/20 h-9 w-9 rounded-full" onClick={(e) => { e.stopPropagation(); handleDeleteModule(); }}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <AccordionContent className="pb-6 pt-6 px-6 bg-card/50 border-t">
                <div className="space-y-3">
                    {module.lessons.map((lesson) => (
                        <LessonItem key={lesson.id} lesson={lesson} courseId={courseId} />
                    ))}

                    <Dialog open={isAddLessonOpen} onOpenChange={setIsAddLessonOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full mt-4 border-dashed h-10">
                                <Plus className="w-4 h-4 mr-2" /> Agregar Lección
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nueva Lección</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Título de la lección</Label>
                                    <Input
                                        value={newLessonTitle}
                                        onChange={(e) => setNewLessonTitle(e.target.value)}
                                        placeholder="Ej: Configuración inicial"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateLesson} disabled={isPending}>Crear</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

function LessonItem({ lesson, courseId }: { lesson: Lesson; courseId: string }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editTitle, setEditTitle] = useState(lesson.title);
    // Parse duration string "5 min" -> 5 number
    const initialDuration = parseInt(lesson.duration) || 0;
    const [editDuration, setEditDuration] = useState(initialDuration);
    const [editFree, setEditFree] = useState(lesson.isFree || false);
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    async function handleUpdate() {
        setIsPending(true);
        const res = await updateLesson(lesson.id, {
            title: editTitle,
            duration: editDuration,
            free_preview: editFree
        }, courseId);
        setIsPending(false);
        if (res.success) {
            toast.success("Lección actualizada");
            setIsEditOpen(false);
            router.refresh();
        } else {
            toast.error(res.message);
        }
    }

    async function handleDelete() {
        if (!confirm("¿Eliminar lección?")) return;
        const res = await deleteLesson(lesson.id, courseId);
        if (res.success) {
            toast.success("Lección eliminada");
            router.refresh();
        } else {
            toast.error(res.message);
        }
    }

    return (
        <div className="flex items-center justify-between p-3 bg-background border rounded-md group">
            <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <Video className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-sm font-medium">{lesson.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{lesson.duration}</span>
                        {lesson.isFree && (
                            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 rounded">
                                <Unlock className="w-3 h-3" /> Gratis
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Pencil className="w-3.5 h-3.5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Lección</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Título</Label>
                                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="grid gap-2 flex-1">
                                    <Label>Duración (minutos)</Label>
                                    <Input
                                        type="number"
                                        value={editDuration}
                                        onChange={(e) => setEditDuration(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <Switch checked={editFree} onCheckedChange={setEditFree} id="free-mode" />
                                    <Label htmlFor="free-mode">Vista previa gratuita</Label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleUpdate} disabled={isPending}>Guardar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDelete}>
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
}
