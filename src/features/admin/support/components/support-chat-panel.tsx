"use client";

import { useState, useEffect, useRef } from "react";
import {
    type SupportChat,
    type SupportMessage,
    getChatMessages,
    sendAdminMessage,
    markChatAsRead
} from "../actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface SupportChatPanelProps {
    chat: SupportChat;
    onMessageSent: () => void;
    onChatRead: () => void;
}

export function SupportChatPanel({ chat, onMessageSent, onChatRead }: SupportChatPanelProps) {
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Cargar mensajes cuando cambia el chat
    useEffect(() => {
        const loadMessages = async () => {
            setIsLoading(true);
            const result = await getChatMessages(chat.userId);
            if (result.success && result.messages) {
                setMessages(result.messages);

                // Marcar como leídos
                if (chat.unreadCount > 0) {
                    await markChatAsRead(chat.userId);
                    onChatRead();
                }
            }
            setIsLoading(false);
        };

        loadMessages();
    }, [chat.userId, chat.unreadCount, onChatRead]);

    // Auto-scroll al último mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        const result = await sendAdminMessage(chat.userId, newMessage);

        if (result.success) {
            setNewMessage("");
            // Recargar mensajes
            const messagesResult = await getChatMessages(chat.userId);
            if (messagesResult.success && messagesResult.messages) {
                setMessages(messagesResult.messages);
            }
            onMessageSent();
            toast.success("Mensaje enviado");
        } else {
            toast.error(result.error || "Error al enviar mensaje");
        }

        setIsSending(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSend();
        }
    };

    // Iniciales para avatar
    const initials = (chat.userName || chat.userEmail)
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-3 border-b bg-muted/30 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={chat.userAvatar || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                        {chat.userName || "Sin nombre"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {chat.userEmail}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Sin mensajes en esta conversación</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isAdmin = msg.sender === "admin";
                        const time = format(new Date(msg.createdAt), "HH:mm", { locale: es });
                        const date = format(new Date(msg.createdAt), "d MMM", { locale: es });

                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex",
                                    isAdmin ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[70%] rounded-lg px-3 py-2",
                                        isAdmin
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                    )}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                        {msg.message}
                                    </p>
                                    <p className={cn(
                                        "text-[10px] mt-1",
                                        isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"
                                    )}>
                                        {date} · {time}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-background">
                <div className="flex gap-2">
                    <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribí tu respuesta... (Cmd+Enter para enviar)"
                        className="min-h-[60px] max-h-[120px] resize-none"
                        disabled={isSending}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || isSending}
                        size="icon"
                        className="h-[60px] w-[60px]"
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
