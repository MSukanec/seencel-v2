'use client';

import { Check, ChevronsUpDown, Globe } from "lucide-react";
import * as React from "react";
import flags from "react-phone-number-input/flags";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface Country {
    id: string;
    name: string;
    alpha_2: string | null;
}

interface CountrySelectorProps {
    value: string;
    onChange: (value: string) => void;
    countries: Country[];
    disabled?: boolean;
    placeholder?: string;
}

export function CountrySelector({
    value,
    onChange,
    countries,
    disabled,
    placeholder = "Seleccionar país...",
}: CountrySelectorProps) {
    const [open, setOpen] = React.useState(false);
    const t = useTranslations('Settings.Profile');

    // Find selected country
    const selectedCountry = countries.find((c) => c.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between h-10 font-normal",
                        !value && "text-muted-foreground"
                    )}
                    disabled={disabled}
                >
                    <span className="flex items-center gap-2 truncate">
                        {selectedCountry ? (
                            <>
                                <FlagComponent alpha2={selectedCountry.alpha_2} name={selectedCountry.name} />
                                <span className="truncate">{selectedCountry.name}</span>
                            </>
                        ) : (
                            <>
                                <Globe className="h-4 w-4 opacity-50" />
                                <span>{placeholder}</span>
                            </>
                        )}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={t('searchCountry')} />
                    <CommandList>
                        <CommandEmpty>{t('noCountryFound')}</CommandEmpty>
                        <CommandGroup>
                            {countries.map((country) => (
                                <CommandItem
                                    key={country.id}
                                    value={country.name}
                                    onSelect={() => {
                                        onChange(country.id);
                                        setOpen(false);
                                    }}
                                    className="gap-2"
                                >
                                    <FlagComponent alpha2={country.alpha_2} name={country.name} />
                                    <span className="flex-1 text-sm truncate">{country.name}</span>
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            value === country.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// Flag component using react-phone-number-input flags
function FlagComponent({ alpha2, name }: { alpha2: string | null; name: string }) {
    if (!alpha2) {
        return (
            <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 text-xs items-center justify-center">
                <Globe className="h-3 w-3 opacity-50" />
            </span>
        );
    }

    const Flag = flags[alpha2 as keyof typeof flags];

    return (
        <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 text-xs items-center justify-center">
            {Flag ? <Flag title={name} /> : alpha2}
        </span>
    );
}
