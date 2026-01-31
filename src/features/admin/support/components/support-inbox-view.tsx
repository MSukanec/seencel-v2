"use client";

import { useState, useEffect } from "react";
import { getSupportChats, type SupportChat } from "../actions";
import { SupportChatList } from "./support-chat-list";
import { SupportChatPanel } from "./support-chat-panel";
import { MessageCircle, Inbox } from "lucide-react";

export function SupportInboxView() {
    const [chats, setChats] = useState<SupportChat[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadChats = async () => {
        const result = await getSupportChats();
        if (result.success && result.chats) {
            setChats(result.chats);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadChats();
    }, []);

    const selectedChat = chats.find(c => c.userId === selectedUserId);

    const handleSelectChat = (userId: string) => {
        setSelectedUserId(userId);
    };

    const handleMessageSent = () => {
        // Recargar chats para actualizar el último mensaje
        loadChats();
    };

    const handleChatRead = () => {
        // Recargar chats para actualizar el contador de no leídos
        loadChats();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-muted-foreground">
                    Cargando conversaciones...
                </div>
            </div>
        );
    }

    if (chats.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
                <div className="text-center text-muted-foreground">
                    <Inbox className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Sin mensajes</p>
                    <p className="text-sm">No hay conversaciones de soporte aún</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[600px] border rounded-lg overflow-hidden bg-background">
            {/* Lista de chats - 1/3 del ancho */}
            <div className="w-1/3 border-r flex flex-col">
                <div className="p-3 border-b bg-muted/30">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <MessageCircle className="h-4 w-4" />
                        <span>Conversaciones</span>
                        <span className="ml-auto bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                            {chats.length}
                        </span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <SupportChatList
                        chats={chats}
                        selectedUserId={selectedUserId}
                        onSelectChat={handleSelectChat}
                    />
                </div>
            </div>

            {/* Panel de chat - 2/3 del ancho */}
            <div className="w-2/3 flex flex-col">
                {selectedChat ? (
                    <SupportChatPanel
                        chat={selectedChat}
                        onMessageSent={handleMessageSent}
                        onChatRead={handleChatRead}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>Seleccioná una conversación</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
