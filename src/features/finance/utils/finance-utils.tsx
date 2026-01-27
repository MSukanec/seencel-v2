import { Badge } from "@/components/ui/badge";
import {
    Users,
    ShoppingCart,
    Briefcase,
    Wallet,
    ArrowLeftRight,
    Coins,
    Building,
    Crown
} from "lucide-react";

export function getPaymentBadge(type: string) {
    switch (type) {
        case 'client_payment':
            return (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                    <Users className="w-3 h-3 mr-1" /> Cliente
                </Badge>
            );
        case 'material_payment':
            return (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
                    <ShoppingCart className="w-3 h-3 mr-1" /> Materiales
                </Badge>
            );
        case 'personnel_payment':
            return (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200">
                    <Briefcase className="w-3 h-3 mr-1" /> Personal
                </Badge>
            );
        case 'partner_contribution':
            return (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
                    <Crown className="w-3 h-3 mr-1" /> Aporte Socio
                </Badge>
            );
        case 'partner_withdrawal':
            return (
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
                    <Crown className="w-3 h-3 mr-1" /> Retiro Socio
                </Badge>
            );
        case 'general_cost_payment':
            return (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                    <Building className="w-3 h-3 mr-1" /> Gastos Grales
                </Badge>
            );
        case 'wallet_transfer':
            return (
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-200">
                    <ArrowLeftRight className="w-3 h-3 mr-1" /> Transferencia
                </Badge>
            );
        case 'currency_exchange':
            return (
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-200">
                    <Coins className="w-3 h-3 mr-1" /> Cambio Moneda
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                    <Wallet className="w-3 h-3 mr-1" /> {type}
                </Badge>
            );
    }
}
