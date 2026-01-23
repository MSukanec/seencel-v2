"use client";

import * as React from "react";
import { UserProfile } from "@/types/user";

interface UserContextType {
    user: UserProfile | null | undefined;
}

const UserContext = React.createContext<UserContextType>({
    user: undefined,
});

export function UserProvider({
    children,
    user,
}: {
    children: React.ReactNode;
    user: UserProfile | null | undefined;
}) {
    return (
        <UserContext.Provider value={{ user }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = React.useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}

