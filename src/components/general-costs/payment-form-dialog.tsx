"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { cn } from "@/lib/utils";
import { GeneralCost, GeneralCostPaymentView } from "@/types/general-costs";
import { createGeneralCostPayment, updateGeneralCostPayment } from "@/actions/general-costs";

const formSchema = z.object({
    payment_date: z.date({
        required_error: "La fecha es obligatoria",
    }),
    general_cost_id: z.string().optional(),
    amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
    status: z.enum(["pending", "confirmed", "overdue", "cancelled"]),
    currency_id: z.string().min(1, "Moneda obligatoria"),
    wallet_id: z.string().min(1, "Billetera obligatoria"),
});

interface PaymentFormDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    paymentToEdit?: GeneralCostPaymentView;
    concepts: GeneralCost[];
    organizationId?: string;
}

export function PaymentFormDialog({
    open,
    onOpenChange,
    paymentToEdit,
    concepts,
    organizationId
}: PaymentFormDialogProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            payment_date: new Date(),
            general_cost_id: "",
            amount: 0,
            status: "confirmed",
            currency_id: "USD", // Placeholder default
            wallet_id: "CASH", // Placeholder default
        },
    });

    useEffect(() => {
        if (paymentToEdit) {
            form.reset({
                payment_date: paymentToEdit.payment_date ? new Date(paymentToEdit.payment_date) : new Date(),
                general_cost_id: paymentToEdit.general_cost_id || "",
                amount: paymentToEdit.amount,
                status: (paymentToEdit.status as "pending" | "confirmed" | "overdue" | "cancelled") || "confirmed",
                currency_id: paymentToEdit.currency_id,
                wallet_id: paymentToEdit.wallet_id,
            });
        } else {
            form.reset({
                payment_date: new Date(),
                general_cost_id: "",
                amount: 0,
                status: "confirmed",
                currency_id: "USD",
                wallet_id: "CASH",
            });
        }
    }, [paymentToEdit, form, open]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!organizationId && !paymentToEdit) {
            toast.error("Error: Falta ID de organización");
            return;
        }

        startTransition(async () => {
            try {
                // Formatting date to ISO string for DB
                const payload = {
                    ...values,
                    payment_date: values.payment_date.toISOString(),
                };

                if (paymentToEdit) {
                    await updateGeneralCostPayment(paymentToEdit.id, payload);
                    toast.success("Pago actualizado");
                } else {
                    await createGeneralCostPayment({
                        ...payload,
                        organization_id: organizationId!,
                    });
                    toast.success("Pago registrado");
                }
                onOpenChange?.(false);
                form.reset();
            } catch (error) {
                console.error(error);
                toast.error("Error al guardar el pago");
            }
        });
    }

    const isEditing = !!paymentToEdit;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Pago" : "Registrar Pago"}</DialogTitle>
                    <DialogDescription>
                        Registra un nuevo pago asociado a un concepto.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="payment_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Fecha de Pago</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Selecciona una fecha</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date: Date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="general_cost_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Concepto</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona el concepto" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {concepts.map((concept) => (
                                                <SelectItem key={concept.id} value={concept.id}>
                                                    {concept.name}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="none">Sin concepto (Varios)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Estado" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pending">Pendiente</SelectItem>
                                                <SelectItem value="confirmed">Confirmado</SelectItem>
                                                <SelectItem value="overdue">Vencido</SelectItem>
                                                <SelectItem value="cancelled">Cancelado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Placeholder for Currency - simplistic for now */}
                            <FormField
                                control={form.control}
                                name="currency_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Moneda</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Moneda" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="USD">USD</SelectItem>
                                                <SelectItem value="EUR">EUR</SelectItem>
                                                <SelectItem value="ARS">ARS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Actualizar Pago" : "Registrar Pago"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
