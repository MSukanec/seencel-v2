"use client";

import { useState } from "react";
import { CourseWithDetails } from "@/features/academy/types";
import { ContentLayout } from "@/components/layout";
import { PageHeaderActionPortal } from "@/components/layout/dashboard/header/page-header";
import { Button } from "@/components/ui/button";
import { Download, Award, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface CourseCertificateViewProps {
    course: CourseWithDetails;
    studentName: string;
    instructorName: string;
    isCompleted: boolean;
    completionDate?: string;
    courseSlug: string;
}

export function CourseCertificateView({
    course,
    studentName,
    instructorName,
    isCompleted,
    completionDate
}: CourseCertificateViewProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (!isCompleted) {
            toast.error("Debes completar el curso para descargar el certificado.");
            return;
        }

        setIsDownloading(true);
        const toastId = toast.loading("Generando certificado PDF...");

        try {
            const certificateElement = document.getElementById("certificate-content");
            if (!certificateElement) throw new Error("No se encontró el elemento del certificado.");

            const canvas = await html2canvas(certificateElement, {
                scale: 3, // High quality
                useCORS: true,
                allowTaint: true,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById("certificate-content");
                    if (clonedElement) {
                        // Ensure it fits A4 format exactly for the canvas
                        clonedElement.style.width = '1123px';
                        clonedElement.style.height = '794px';
                        clonedElement.style.transform = 'none';
                    }
                }
            });

            const imgData = canvas.toDataURL("image/jpeg", 1.0);
            
            // PDF: Landscape A4 (297mm x 210mm)
            const pdf = new jsPDF("l", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Certificado - ${course.title}.pdf`);

            toast.success("Certificado descargado con éxito.", { id: toastId });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Error al generar el PDF. Inténtalo nuevamente.", { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <ContentLayout variant="narrow">
            <PageHeaderActionPortal>
                <Button 
                    onClick={handleDownload} 
                    disabled={!isCompleted || isDownloading}
                    className="gap-2"
                >
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Descargar Certificado
                </Button>
            </PageHeaderActionPortal>

            <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-4 bg-muted/20 border rounded-xl overflow-hidden min-h-[500px] relative">
                    {/* 
                        Preview Container 
                        We scale it down using CSS transform so it fits nicely on the screen,
                        but the actual element is kept large (A4 ratio) for high-quality PDF generation.
                    */}
                    <div 
                        className={cn(
                            "relative overflow-hidden rounded-xl transition-all duration-300",
                            !isCompleted && " opacity-[0.85] grayscale-[0.5] pointer-events-none"
                        )}
                        style={{
                            width: "100%",
                            maxWidth: "1000px",
                            aspectRatio: "1.414 / 1", // A4 Landscape ratio
                            containerType: "inline-size"
                        }}
                    >
                        {/* 
                            This is the actual element that html2canvas will capture.
                            It has a fixed width/height close to A4 landscape proportions in pixels.
                            It uses absolute positioning and CSS scale to fit within the responsive container above.
                        */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div
                                id="certificate-content"
                                className="bg-[#ffffff] text-[#18181b] absolute shadow-[0_0_40px_rgba(0,0,0,0.1)] overflow-hidden"
                                style={{
                                    width: "1123px", // A4 Landscape width @ 96DPI
                                    height: "794px", // A4 Landscape height @ 96DPI
                                    transformOrigin: "center center",
                                    // Scale it to fit the container
                                    transform: `scale(calc(max(0.1, min(1, 100cqw / 1123))))`
                                }}
                            >
                                {/* Certificate Background/Border Design */}
                                <div className="absolute inset-4 border-2 border-[#699419]/20 bg-[#fafafa]/50" />
                                <div className="absolute inset-6 border-[8px] border-[#699419]/10" />
                                
                                {/* Decorative elements */}
                                <div className="absolute top-0 left-0 w-64 h-64 bg-[#699419]/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
                                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#699419]/5 rounded-full translate-x-1/2 translate-y-1/2" />
                                
                                {/* Content Area */}
                                <div className="relative h-full w-full flex flex-col items-center justify-center p-20 text-center">
                                    <div className="mb-10 w-24 h-24 bg-[#699419]/10 rounded-full flex items-center justify-center border-4 border-white shadow-sm mx-auto">
                                        <Award className="w-12 h-12 text-[#699419]" />
                                    </div>

                                    <h1 className="text-sm font-bold tracking-[0.2em] text-[#699419] uppercase mb-6">
                                        Seencel Academy
                                    </h1>
                                    
                                    <h2 className="text-4xl font-serif text-[#52525b] mb-12 italic">
                                        Certificado de Finalización
                                    </h2>
                                    
                                    <p className="text-lg text-[#71717a] mb-4">
                                        Se otorga el presente certificado a:
                                    </p>
                                    
                                    <div className="text-5xl font-bold text-[#18181b] mb-8 pb-4 border-b-2 border-[#e4e4e7] w-3/4 max-w-2xl mx-auto tracking-tight font-serif min-h-[60px]">
                                        {studentName}
                                    </div>
                                    
                                    <p className="text-lg text-[#71717a] mb-4">
                                        Por haber completado con éxito el curso:
                                    </p>
                                    
                                    <h3 className="text-3xl font-bold tracking-tight text-[#699419] mb-12 max-w-3xl leading-tight">
                                        {course.title}
                                    </h3>
                                    
                                    {/* Footer Info */}
                                    <div className="flex w-full max-w-3xl justify-between items-end mt-auto pt-8">
                                        <div className="text-left w-64">
                                            <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Fecha de Finalización</p>
                                            <p className="text-base font-semibold text-[#27272a]">
                                                {completionDate ? new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(new Date(completionDate)) : "—"}
                                            </p>
                                        </div>
                                        
                                        <div className="text-center pb-2">
                                            {/* Signature Mock */}
                                            <div className="w-48 h-12 border-b border-[#27272a] mb-2 relative">
                                                <div className="absolute inset-0 flex items-center justify-center opacity-70">
                                                    <span className="font-serif italic text-3xl text-[#27272a] transform -rotate-2">
                                                        {instructorName}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">{instructorName}</p>
                                            <p className="text-xs text-[#71717a]">Instructor del Curso</p>
                                        </div>
                                        
                                        <div className="text-right w-64">
                                            <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">ID del Certificado</p>
                                            <p className="text-xs font-mono text-[#71717a]">SC-{course.id.substring(0, 8).toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Overlay Badge for Locked State */}
                        {!isCompleted && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-background/20 backdrop-blur-[2px] rounded-xl">
                                <div className="bg-background/95 border border-border/50 shadow-lg rounded-xl p-5 flex flex-col items-center text-center max-w-[280px]">
                                    <div className="w-10 h-10 bg-warning/10 text-warning rounded-full flex items-center justify-center mb-3">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-base font-bold text-foreground mb-1.5">Certificado Bloqueado</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Completa el 100% de las lecciones para habilitar la descarga.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ContentLayout>
    );
}
