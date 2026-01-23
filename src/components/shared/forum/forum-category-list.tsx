"use client";

import { ForumCategory } from "@/actions/forum";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    MessageSquare,
    Lock,
    ChevronRight,
    BookOpen,
    Code,
    Lightbulb,
    HelpCircle,
    Megaphone,
    Users,
    Palette,
    Wrench,
    Layers,
    FileText,
    Rocket,
    Star
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// Map icon names from DB to Lucide icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    MessageSquare,
    BookOpen,
    Code,
    Lightbulb,
    HelpCircle,
    Megaphone,
    Users,
    Palette,
    Wrench,
    Layers,
    FileText,
    Rocket,
    Star,
};

interface ForumCategoryListProps {
    categories: ForumCategory[];
    onCategorySelect: (categoryId: string) => void;
}

export function ForumCategoryList({
    categories,
    onCategorySelect,
}: ForumCategoryListProps) {
    const t = useTranslations("Forum");

    if (categories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("noCategoriesTitle")}</h3>
                <p className="text-muted-foreground text-center max-w-md">
                    {t("noCategoriesDescription")}
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-4 md:p-6">
            {categories.map((category) => {
                // Get the icon component or default to MessageSquare
                const IconComponent = category.icon && iconMap[category.icon]
                    ? iconMap[category.icon]
                    : MessageSquare;

                return (
                    <Card
                        key={category.id}
                        className={cn(
                            "group cursor-pointer transition-all hover:shadow-lg hover:border-primary/30",
                            category.is_read_only && "opacity-75"
                        )}
                        onClick={() => onCategorySelect(category.id)}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground mb-2 bg-primary"
                                >
                                    <IconComponent className="h-5 w-5" />
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                {category.name}
                            </CardTitle>
                            {category.description && (
                                <CardDescription className="line-clamp-2">
                                    {category.description}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>{category.thread_count || 0} {t("threads")}</span>
                                </div>
                                {category.is_read_only && (
                                    <Badge variant="secondary" className="ml-auto">
                                        <Lock className="h-3 w-3 mr-1" />
                                        {t("readOnly")}
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

