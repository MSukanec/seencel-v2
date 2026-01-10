"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FormGroup } from "@/components/ui/form-group";
import { cn } from "@/lib/utils";

export interface ManagedListItem {
    id: string;
    label: string;
}

export interface ManagedListOption {
    label: string;
    value: string;
}

interface ManagedListProps {
    items: ManagedListItem[];
    availableOptions: ManagedListOption[];
    onAdd: (value: string) => void;
    onRemove: (id: string) => void;
    maxItems?: number;
    disabled?: boolean;
    dialogTitle?: string;
    dialogDescription?: string;
    selectLabel?: string;
    selectPlaceholder?: string;
    className?: string;
}

export function ManagedList({
    items,
    availableOptions,
    onAdd,
    onRemove,
    maxItems,
    disabled = false,
    dialogTitle = "Agregar Elemento",
    dialogDescription = "Selecciona un elemento para agregar a la lista.",
    selectLabel = "Elemento",
    selectPlaceholder = "Seleccionar...",
    className,
}: ManagedListProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedValue, setSelectedValue] = React.useState<string>("");

    const canAdd = maxItems ? items.length < maxItems : true;

    const handleAdd = () => {
        if (!selectedValue) return;
        onAdd(selectedValue);
        setIsOpen(false);
        setSelectedValue("");
    };

    return (
        <div className={cn("space-y-3", className)}>
            {/* List of Selected Items */}
            {items.length > 0 && (
                <div className="flex flex-col gap-2">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={cn(
                                "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs whitespace-nowrap outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 h-9 dark:bg-input/30 dark:hover:bg-input/50"
                            )}
                        >
                            <span className="truncate flex-1 text-left">{item.label}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                                disabled={disabled}
                                onClick={() => onRemove(item.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Trigger (Select Style) - Only visible if can add */}
            {canAdd && (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isOpen}
                            className={cn(
                                "w-full justify-between px-3 py-2 font-normal text-muted-foreground h-9 bg-transparent dark:bg-input/30 dark:hover:bg-input/50",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                            disabled={disabled}
                        >
                            <span className="truncate">
                                {selectPlaceholder}
                            </span>
                            <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{dialogTitle}</DialogTitle>
                            {dialogDescription && (
                                <DialogDescription>{dialogDescription}</DialogDescription>
                            )}
                        </DialogHeader>
                        <div className="py-4">
                            <FormGroup label={selectLabel}>
                                <Select
                                    value={selectedValue}
                                    onValueChange={setSelectedValue}
                                    disabled={disabled}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={selectPlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormGroup>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleAdd} disabled={!selectedValue || disabled}>
                                Agregar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
