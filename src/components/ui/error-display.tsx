"use client";

import { TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
    title: string;
    message: string;
    retryLabel: string;
}

export function ErrorDisplay({ title, message, retryLabel }: ErrorDisplayProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="p-3 bg-red-500/10 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground w-full max-w-sm mx-auto">
                    {message}
                </p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
                {retryLabel}
            </Button>
        </div>
    );
}

