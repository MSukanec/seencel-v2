import { Check, ChevronsUpDown, Globe } from "lucide-react";

import * as React from "react";

import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import es from 'react-phone-number-input/locale/es';

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input"; // Removed InputProps to avoid conflict if not exported
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

type PhoneInputProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
> &
    Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
        onChange?: (value: RPNInput.Value) => void;
    };

const PhoneInput = React.forwardRef<
    React.ElementRef<typeof RPNInput.default>,
    PhoneInputProps
>(({ className, onChange, ...props }, ref) => {
    const locale = useLocale();

    const onChangeRef = React.useRef(onChange);

    React.useLayoutEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const CountrySelectWrapper = React.useMemo(() => {
        return (props: CountrySelectProps) => (
            <CountrySelect
                {...props}
                onChange={(country) => {
                    props.onChange(country);
                    if (country) {
                        setTimeout(() => {
                            onChangeRef.current?.(`+${RPNInput.getCountryCallingCode(country)}` as RPNInput.Value);
                        }, 0);
                    }
                }}
            />
        );
    }, []);

    // Sanitize value to prevent "Expected E.164" error
    const safeValue = React.useMemo(() => {
        if (props.value && typeof props.value === 'string') {
            if (props.value.startsWith('+')) {
                return props.value as RPNInput.Value;
            } else {
                // Try to salvage if it looks like a number but missing +?
                // For now, to prevent crash, we return undefined for invalid E.164
                // We could also try to prepend '+' but if country code is missing it's ambiguous.
                console.warn(`PhoneInput received invalid E.164 value: "${props.value}". Resetting to empty to prevent crash.`);
                return undefined;
            }
        }
        return props.value as RPNInput.Value | undefined;
    }, [props.value]);

    return (
        <RPNInput.default
            ref={ref}
            className={cn("flex", className)}
            flagComponent={FlagComponent}
            countrySelectComponent={CountrySelectWrapper}
            inputComponent={InputComponent}
            labels={locale === 'es' ? es : undefined}
            {...props}
            value={safeValue} // Override value with safe version
            /**
             * Handles the onChange event.
             *
             * react-phone-number-input might trigger the onChange event as undefined
             * if a valid phone number is not generated.
             *
             * @param value
             */
            onChange={(value) => onChange?.(value as RPNInput.Value)} // Cast for strict type safety
        />
    );
});
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<HTMLInputElement, any>( // Typed as any to be safe with RPNInput expectations
    ({ className, ...props }, ref) => (
        <Input
            className={cn("rounded-e-lg rounded-s-none h-10", className)}
            {...props}
            ref={ref}
        />
    )
);
InputComponent.displayName = "InputComponent";

type CountrySelectOption = { label: string; value: RPNInput.Country };

type CountrySelectProps = {
    disabled?: boolean;
    value: RPNInput.Country;
    onChange: (value: RPNInput.Country) => void;
    options: CountrySelectOption[];
};

const CountrySelect = ({
    disabled,
    value,
    onChange,
    options,
}: CountrySelectProps) => {
    const handleSelect = React.useCallback(
        (country: RPNInput.Country) => {
            onChange(country);
        },
        [onChange]
    );

    const filteredOptions = React.useMemo(() => {
        return options.filter((x) => x.value);
    }, [options]);

    const t = useTranslations('Settings.PhoneInput');

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant={"outline"}
                    className={cn("flex gap-1 rounded-e-none rounded-s-lg px-3 border-r-0 focus-visible:z-10 h-10")}
                    disabled={disabled}
                >
                    <FlagComponent country={value} countryName={value} />
                    <ChevronsUpDown
                        className={cn(
                            "-mr-2 h-4 w-4 opacity-50",
                            disabled ? "hidden" : "opacity-100"
                        )}
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={t('search')} />
                    <CommandList>
                        <CommandEmpty>{t('empty')}</CommandEmpty>
                        <CountryList
                            options={filteredOptions}
                            value={value}
                            onChange={handleSelect}
                        />
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
    const Flag = flags[country];

    return (
        <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 text-xs items-center justify-center">
            {Flag ? <Flag title={countryName} /> : <Globe className="h-3 w-3 opacity-50" />}
        </span>
    );
};
FlagComponent.displayName = "FlagComponent";

const CountryList = ({
    options,
    value,
    onChange,
}: {
    options: CountrySelectOption[];
    value: RPNInput.Country;
    onChange: (value: RPNInput.Country) => void;
}) => {
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // Render first 12 items initially for instant paint, then the rest
    const displayedOptions = isMounted ? options : options.slice(0, 12);

    return (
        <CommandGroup>
            {displayedOptions.map((option) => (
                <CommandItem
                    className="gap-2"
                    key={option.value}
                    onSelect={() => onChange(option.value)}
                >
                    <FlagComponent
                        country={option.value}
                        countryName={option.label}
                    />
                    <span className="flex-1 text-sm">{option.label}</span>
                    {option.value && (
                        <span className="text-foreground/50 text-sm">
                            {`+${RPNInput.getCountryCallingCode(option.value)}`}
                        </span>
                    )}
                    <Check
                        className={cn(
                            "ml-auto h-4 w-4",
                            option.value === value ? "opacity-100" : "opacity-0"
                        )}
                    />
                </CommandItem>
            ))}
        </CommandGroup>
    );
};

export { PhoneInput };

