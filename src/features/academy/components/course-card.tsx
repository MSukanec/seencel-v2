import { Link } from "@/i18n/routing";
import { CourseWithDetails } from "@/types/courses";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, BookOpen, User, Play } from "lucide-react";

interface CourseCardProps {
    course: CourseWithDetails;
    className?: string;
    basePath?: string;
    isEnrolled?: boolean;
    isPurchaseEnabled?: boolean;
}

export function CourseCard({ course, className, basePath = '/academy/courses', isEnrolled = false, isPurchaseEnabled = true }: CourseCardProps) {
    const { details } = course;

    // Format price - show USD explicitly
    const formattedPrice = isPurchaseEnabled
        ? (course.price
            ? `USD ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(course.price)}`
            : 'Free')
        : '-';

    return (
        <Card className={cn("overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow", className)}>
            <div className="aspect-video w-full bg-muted relative overflow-hidden group">
                {(course.image_path || details?.image_path) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={course.image_path || details?.image_path || ''}
                        alt={course.title}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full bg-secondary/30 text-muted-foreground">
                        <BookOpen className="w-12 h-12 opacity-20" />
                    </div>
                )}
                {details?.badge_text && (
                    <Badge className="absolute top-2 right-2" variant="secondary">
                        {details.badge_text}
                    </Badge>
                )}
                {isEnrolled && (
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                        Inscrito
                    </Badge>
                )}
            </div>

            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-semibold line-clamp-2 leading-tight">
                        <Link
                            href={`${basePath}/${course.slug}` as any}
                            className="hover:underline"
                        >
                            {course.title}
                        </Link>
                    </CardTitle>
                </div>
                {details?.instructor_name && (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <User className="w-3 h-3 mr-1" />
                        {details.instructor_name}
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-4 pt-0 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                    {course.short_description || "No description available."}
                </p>
            </CardContent>

            <CardFooter className="p-4 border-t flex items-center justify-between bg-secondary/5">
                <div className="font-semibold text-primary">
                    {formattedPrice}
                </div>
                <div className="flex gap-2">
                    {isEnrolled && (
                        <Button size="sm" asChild>
                            <Link href={`/academy/my-courses/${course.slug}` as any}>
                                <Play className="w-4 h-4 mr-1" />
                                Continuar
                            </Link>
                        </Button>
                    )}
                    <Button size="sm" variant="outline" asChild>
                        <Link
                            href={`${basePath}/${course.slug}` as any}
                        >
                            Ver detalles
                        </Link>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

