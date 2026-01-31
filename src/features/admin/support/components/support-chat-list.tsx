"use client";

import { type SupportChat } from "../actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface SupportChatListProps {
    chats: SupportChat[];
    selectedUserId: string | null;
    onSelectChat: (userId: string) => void;
}

export function SupportChatList({ chats, selectedUserId, onSelectChat }: SupportChatListProps) {
    return (
        <div className="divide-y">
            {chats.map((chat) => {
                const isSelected = chat.userId === selectedUserId;
                const hasUnread = chat.unreadCount > 0;

                // Formatear tiempo relativo
                const timeAgo = chat.lastMessageAt
                    ? formatDistanceToNow(new Date(chat.lastMessageAt), {
                        addSuffix: false,
                        locale: es
                    })
                    : "";

                // Truncar mensaje
                const truncatedMessage = chat.lastMessage.length > 50
                    ? chat.lastMessage.substring(0, 50) + "..."
                    : chat.lastMessage;

                // Iniciales para avatar
                const initials = (chat.userName || chat.userEmail)
                    .split(" ")
                    .map(n => n[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2);

                return (
                    <button
                        key={chat.userId}
                        onClick={() => onSelectChat(chat.userId)}
                        className={cn(
                            "w-full p-3 text-left hover:bg-muted/50 transition-colors",
                            isSelected && "bg-muted",
                            hasUnread && "bg-primary/5"
                        )}
                    >
                        <div className="flex items-start gap-3">
                            {/* Avatar con indicador de no leído */}
                            <div className="relative">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={chat.userAvatar || undefined} />
                                    <AvatarFallback className="text-xs">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                {hasUnread && (
                                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-destructive rounded-full border-2 border-background" />
                                )}
                            </div>

                            {/* Contenido */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className={cn(
                                        "text-sm truncate",
                                        hasUnread ? "font-semibold" : "font-medium"
                                    )}>
                                        {chat.userName || chat.userEmail}
                                    </span>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {timeAgo}
                                    </span>
                                </div>

                                <p className={cn(
                                    "text-xs truncate mt-0.5",
                                    hasUnread ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {chat.lastMessageSender === 'admin' && (
                                        <span className="text-primary">Tú: </span>
                                    )}
                                    {truncatedMessage}
                                </p>

                                {!chat.userName && (
                                    <p className="text-xs text-muted-foreground truncate">
                                        {chat.userEmail}
                                    </p>
                                )}
                            </div>

                            {/* Badge de no leídos */}
                            {hasUnread && (
                                <span className="bg-destructive text-destructive-foreground text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                    {chat.unreadCount}
                                </span>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
