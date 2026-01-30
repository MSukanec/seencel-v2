import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Pencil, Trash2, Calendar, Wallet } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMoney } from "@/hooks/use-money";

interface SubcontractCardProps {
    subcontract: any;
    onView: (subcontract: any) => void;
    onEdit: (subcontract: any) => void;
    onDelete: (subcontract: any) => void;
}

export function SubcontractCard({ subcontract, onView, onEdit, onDelete }: SubcontractCardProps) {
    const money = useMoney();
    const currentRate = money.config.currentExchangeRate;

    const contact = subcontract.contact;
    const providerName = subcontract.provider_name || contact?.full_name || contact?.company_name || "Proveedor desconocido";
    // Prefer title, fallback to provider name, fallback to generic
    const name = subcontract.title || providerName;
    const description = subcontract.title ? providerName : (subcontract.description || "Sin descripción");

    // Avatar always represents the Provider, not the Subcontract Title
    const avatarFallback = (providerName[0] || "").toUpperCase();
    const imageUrl = subcontract.provider_image || contact?.image_url;

    // Use useMoney.sum() for proper bimonetary conversion respecting displayMode
    const currencyCode = subcontract.currency_code || "ARS";
    const exchangeRate = Number(subcontract.exchange_rate) || currentRate;

    // Create items for sum() - each subcontract amount as a single-item array
    const totalItem = [{ amount: Number(subcontract.amount_total || 0), currency_code: currencyCode, exchange_rate: exchangeRate }];
    const paidItem = [{ amount: Number(subcontract.paid_amount || 0), currency_code: currencyCode, exchange_rate: exchangeRate }];
    const remainingItem = [{ amount: Number(subcontract.remaining_amount || 0), currency_code: currencyCode, exchange_rate: exchangeRate }];

    // DEBUG: Log conversion data
    console.log('[SubcontractCard DEBUG]', {
        title: subcontract.title,
        rawCurrencyCode: subcontract.currency_code,
        usedCurrencyCode: currencyCode,
        rawExchangeRate: subcontract.exchange_rate,
        usedExchangeRate: exchangeRate,
        displayMode: money.displayMode,
        currentRate: currentRate,
        amount_total: subcontract.amount_total,
    });

    // Get converted totals using sum() which respects displayMode
    const totalDisplay = money.sum(totalItem).total;
    const paidDisplay = money.sum(paidItem).total;
    const remainingDisplay = money.sum(remainingItem).total;

    const startDate = subcontract.start_date
        ? format(new Date(subcontract.start_date), "dd MMM yyyy", { locale: es })
        : "-";

    // Status Logic
    const status = subcontract.status || "active";
    let statusLabel = "Activo";
    let statusColor = "bg-emerald-500";
    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";

    switch (status) {
        case "active":
            statusLabel = "Activo";
            statusColor = "bg-emerald-500";
            badgeVariant = "outline";
            break;
        case "completed":
            statusLabel = "Completado";
            statusColor = "bg-blue-500";
            badgeVariant = "secondary";
            break;
        case "cancelled":
            statusLabel = "Cancelado";
            statusColor = "bg-red-500";
            badgeVariant = "destructive";
            break;
        case "draft":
            statusLabel = "Borrador";
            statusColor = "bg-amber-500";
            badgeVariant = "outline"; // border-dashed handled via className if needed
            break;
    }

    // Progress for the gradient line
    const progress = Math.min(100, Math.max(0, subcontract.progress_percentage || 0));

    return (
        <div
            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all group cursor-pointer shadow-sm hover:shadow-md"
            onClick={() => onView(subcontract)}
        >
            {/* Status Line Indicator - Financial Progress Gradient */}
            <div
                className="w-1.5 self-stretch rounded-full shrink-0"
                style={{
                    background: `linear-gradient(to top, var(--amount-positive) ${progress}%, var(--amount-negative) ${progress}%)`
                }}
            />

            {/* Avatar & Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={imageUrl} alt={providerName} />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col min-w-0 gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate text-foreground">{name}</span>
                        <Badge variant={badgeVariant} className="text-[10px] h-5 px-1.5">
                            {statusLabel}
                        </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground truncate">{description}</span>
                </div>
            </div>

            {/* Metrics (Desktop) */}
            <div className="hidden md:flex items-center gap-8 shrink-0 text-sm">
                {/* Financials */}
                <div className="flex items-center gap-6">
                    {/* Total */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Total</span>
                        <span className="font-mono font-medium text-foreground">
                            {money.format(totalDisplay)}
                        </span>
                    </div>

                    {/* Paid */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Pagado</span>
                        <span className="font-mono font-medium text-amount-positive">
                            {money.format(paidDisplay)}
                        </span>
                    </div>

                    {/* Remaining */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Restante</span>
                        <span className="font-mono font-medium text-amount-negative">
                            {money.format(remainingDisplay)}
                        </span>
                    </div>
                </div>

                {/* Date + Exchange Rate DEBUG */}
                <div className="flex items-center gap-2 text-muted-foreground min-w-[120px]">
                    <Calendar className="h-4 w-4" />
                    <span>{startDate}</span>
                </div>
                {/* DEBUG: Show exchange rate */}
                <div className="flex flex-col items-end text-xs">
                    <span className="text-[10px] uppercase text-amber-500 font-semibold">TC</span>
                    <span className="font-mono text-amber-400">
                        {subcontract.exchange_rate ?? 'NULL'} ({currencyCode})
                    </span>
                </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => onEdit(subcontract)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onDelete(subcontract)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
