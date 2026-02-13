"use client";

import { useState, useEffect, useCallback } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Converts a base64 VAPID key to Uint8Array for subscription
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

interface UsePushNotificationsReturn {
    /** Whether Push API is supported in this browser */
    isSupported: boolean;
    /** Whether the user is already subscribed */
    isSubscribed: boolean;
    /** Current permission state: 'default' | 'granted' | 'denied' */
    permission: NotificationPermission | "unsupported";
    /** Subscribe to push notifications */
    subscribe: () => Promise<boolean>;
    /** Unsubscribe from push notifications */
    unsubscribe: () => Promise<boolean>;
    /** Whether a subscription operation is in progress */
    isLoading: boolean;
}

/**
 * Hook for managing Web Push notification subscriptions.
 * Handles permission requests, subscription lifecycle, and server sync.
 */
export function usePushNotifications(): UsePushNotificationsReturn {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
    const [isLoading, setIsLoading] = useState(false);

    // Check support and current state on mount
    useEffect(() => {
        if (typeof window === "undefined") return;

        const supported =
            "serviceWorker" in navigator &&
            "PushManager" in window &&
            "Notification" in window &&
            !!VAPID_PUBLIC_KEY;

        setIsSupported(supported);

        if (!supported) return;

        setPermission(Notification.permission);

        // Check if already subscribed
        navigator.serviceWorker.ready.then((registration) => {
            registration.pushManager.getSubscription().then((sub) => {
                setIsSubscribed(!!sub);
            });
        });
    }, []);

    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported || !VAPID_PUBLIC_KEY) return false;

        setIsLoading(true);
        try {
            // 1. Request permission
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== "granted") {
                setIsLoading(false);
                return false;
            }

            // 2. Get SW registration
            const registration = await navigator.serviceWorker.ready;

            // 3. Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
            });

            // 4. Send subscription to server
            const response = await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription: subscription.toJSON() }),
            });

            if (!response.ok) {
                console.error("[Push] Failed to save subscription:", await response.text());
                // Unsubscribe locally since server failed
                await subscription.unsubscribe();
                setIsLoading(false);
                return false;
            }

            setIsSubscribed(true);
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error("[Push] Subscribe error:", error);
            setIsLoading(false);
            return false;
        }
    }, [isSupported]);

    const unsubscribe = useCallback(async (): Promise<boolean> => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Remove from server
                await fetch("/api/push/subscribe", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });

                // Unsubscribe locally
                await subscription.unsubscribe();
            }

            setIsSubscribed(false);
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error("[Push] Unsubscribe error:", error);
            setIsLoading(false);
            return false;
        }
    }, []);

    return {
        isSupported,
        isSubscribed,
        permission,
        subscribe,
        unsubscribe,
        isLoading,
    };
}
