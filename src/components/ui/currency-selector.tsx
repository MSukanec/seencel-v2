"use client";

import { useCurrency } from '@/stores/organization-store';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, RefreshCw } from 'lucide-react';
import { DisplayCurrency } from '@/types/currency';
import { cn } from '@/lib/utils';

interface CurrencySelectorProps {
    className?: string;
}

/**
 * CurrencySelector - Global currency display toggle for header
 * 
 * Allows users to switch between:
 * - Primary currency (e.g., ARS)
 * - Secondary currency (e.g., USD)  
 * - Both (shows breakdown)
 */
export function CurrencySelector({ className }: CurrencySelectorProps) {
    const {
        primaryCurrency,
        secondaryCurrency,
        displayCurrency,
        setDisplayCurrency
    } = useCurrency();

    if (!primaryCurrency) return null;

    const options: { value: DisplayCurrency; label: string; description: string }[] = [
        {
            value: 'primary',
            label: primaryCurrency.code,
            description: `Ver todo en ${primaryCurrency.name}`
        },
    ];

    if (secondaryCurrency) {
        options.push({
            value: 'secondary',
            label: secondaryCurrency.code,
            description: `Ver todo en ${secondaryCurrency.name}`
        });
        options.push({
            value: 'both',
            label: 'Ambas',
            description: 'Ver montos con desglose'
        });
    }

    const currentOption = options.find(o => o.value === displayCurrency) || options[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground",
                        className
                    )}
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span className="font-medium">{currentOption.label}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Ver montos en
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => setDisplayCurrency(option.value)}
                        className="flex items-center justify-between"
                    >
                        <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">
                                {option.description}
                            </div>
                        </div>
                        {displayCurrency === option.value && (
                            <Check className="h-4 w-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

